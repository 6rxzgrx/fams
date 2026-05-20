import { NextResponse } from 'next/server'
import { priceRatesRepo } from '@/integrations/sheets/repositories/price-rates'
import { CreatePriceRateSchema, PriceRateSchema, ok, fail } from '@/domain/types'
import { isRateStale } from '@/domain/rates'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'
import { env } from '@/lib/env'
import { syncValueIdrBySymbol } from '@/lib/asset-value-sync'

const GOLD_API_URL = 'https://api.gold-api.com/price/XAU/USD'

async function refreshApiRates(): Promise<void> {
  const [goldRes, fxRes] = await Promise.all([
    fetch(GOLD_API_URL, { cache: 'no-store' }),
    fetch(
      `https://api.getgeoapi.com/v2/currency/convert?api_key=${env.GEOAPI_KEY}&from=USD&to=IDR&amount=1&format=json`,
      { cache: 'no-store' },
    ),
  ])

  if (!goldRes.ok || !fxRes.ok) throw new Error('External API fetch failed')

  const goldData = await goldRes.json()
  const fxData = await fxRes.json()

  const xauUsd: number = goldData.price ?? goldData.Price ?? 0
  const usdIdr: number = parseFloat(fxData?.rates?.IDR?.rate ?? '0')

  if (!xauUsd || !usdIdr) throw new Error('Invalid rate data from external APIs')

  const now = new Date().toISOString()
  const rawApiData = JSON.stringify({ xau_usd: xauUsd, usd_idr: usdIdr })

  // Upsert XAU_USD (used as building block for gold conversion)
  const existingXauUsd = await priceRatesRepo.findBySymbol('XAU_USD')
  if (existingXauUsd) {
    await priceRatesRepo.update(existingXauUsd.id, {
      value_idr_per_unit: String(xauUsd),
      raw_api_data: rawApiData,
      updated_at: now,
    })
  } else {
    await priceRatesRepo.create({
      id: generateId('pr'),
      symbol: 'XAU_USD',
      label: 'Emas (USD per troy oz)',
      source: 'api',
      value_idr_per_unit: String(xauUsd),
      unit: 'oz',
      raw_api_data: rawApiData,
      updated_at: now,
    })
  }

  // Upsert USD_IDR
  const existingUsdIdr = await priceRatesRepo.findBySymbol('USD_IDR')
  if (existingUsdIdr) {
    await priceRatesRepo.update(existingUsdIdr.id, {
      value_idr_per_unit: String(usdIdr),
      raw_api_data: rawApiData,
      updated_at: now,
    })
  } else {
    await priceRatesRepo.create({
      id: generateId('pr'),
      symbol: 'USD_IDR',
      label: 'Kurs USD ke IDR',
      source: 'api',
      value_idr_per_unit: String(usdIdr),
      unit: 'USD',
      raw_api_data: rawApiData,
      updated_at: now,
    })
  }

  // Upsert XAU (IDR per gram of gold — the rate assets actually link to)
  const idrPerGram = (xauUsd / 31.1035) * usdIdr
  const existingXau = await priceRatesRepo.findBySymbol('XAU')
  if (existingXau) {
    await priceRatesRepo.update(existingXau.id, {
      value_idr_per_unit: String(Math.round(idrPerGram)),
      raw_api_data: rawApiData,
      updated_at: now,
    })
  } else {
    await priceRatesRepo.create({
      id: generateId('pr'),
      symbol: 'XAU',
      label: 'Emas (IDR per gram)',
      source: 'api',
      value_idr_per_unit: String(Math.round(idrPerGram)),
      unit: 'gram',
      raw_api_data: rawApiData,
      updated_at: now,
    })
  }

  // Propagate updated XAU rate to all linked non-liquid assets
  await syncValueIdrBySymbol('XAU')
}

export async function GET() {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const rates = await priceRatesRepo.findAll()

    // Check if any API rate is stale (or missing entirely)
    const apiRates = rates.filter((r) => r.source === 'api')
    const hasStaleRate =
      apiRates.length === 0 ||
      apiRates.some((r) => isRateStale(r.updated_at))

    if (hasStaleRate) {
      try {
        await refreshApiRates()
        const fresh = await priceRatesRepo.findAll()
        return NextResponse.json(ok(fresh))
      } catch (fetchErr) {
        console.error('[price-rates] external API refresh failed', fetchErr)
        // Return stale data rather than erroring — better than no data
        return NextResponse.json(ok(rates))
      }
    }

    return NextResponse.json(ok(rates))
  } catch (err) {
    console.error('[price-rates GET]', err)
    return NextResponse.json(fail('Gagal memuat konverter harga'), { status: 500 })
  }
}

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const rl = checkRateLimit(member.id, 'writes')
  if (!rl.ok) {
    return NextResponse.json(fail('Terlalu banyak permintaan'), {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    })
  }

  try {
    const body = await req.json()
    const parsed = CreatePriceRateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    // Prevent duplicate symbols
    const existing = await priceRatesRepo.findBySymbol(parsed.data.symbol)
    if (existing) {
      return NextResponse.json(fail(`Symbol '${parsed.data.symbol}' sudah ada`), { status: 409 })
    }

    const now = new Date().toISOString()
    const id = generateId('pr')

    const rate = await priceRatesRepo.create({
      id,
      symbol: parsed.data.symbol,
      label: parsed.data.label,
      source: 'manual',
      value_idr_per_unit: String(parsed.data.value_idr_per_unit),
      unit: parsed.data.unit,
      raw_api_data: '',
      updated_at: now,
    })

    const validated = PriceRateSchema.parse(rate)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'price_rate',
      entityId: id,
      after: validated,
    })

    return NextResponse.json(ok(validated), { status: 201 })
  } catch (err) {
    console.error('[price-rates POST]', err)
    return NextResponse.json(fail('Gagal menyimpan rate'), { status: 500 })
  }
}
