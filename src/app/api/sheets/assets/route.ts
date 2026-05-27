import { NextResponse } from 'next/server'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { assetMutationsRepo } from '@/integrations/sheets/repositories/asset-mutations'
import { priceRatesRepo } from '@/integrations/sheets/repositories/price-rates'
import { CreateAssetSchema, ok, fail } from '@/domain/types'
import { computeValueIdr } from '@/domain/rates'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET() {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const all = await assetsRepo.findAll()
    const assets = all.filter((a) => a.kind === 'non_liquid')
    return NextResponse.json(ok(assets))
  } catch (err) {
    console.error('[assets GET]', err)
    return NextResponse.json(fail('Gagal memuat aset'), { status: 500 })
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
    // Client sends without kind; we enforce kind='non_liquid' server-side
    const parsed = CreateAssetSchema.omit({ kind: true }).safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const now = new Date().toISOString()
    const id = generateId('asset')

    const rates = await priceRatesRepo.findAll()
    const value_idr = computeValueIdr(
      parsed.data.current_balance,
      parsed.data.satuan,
      parsed.data.price_symbol,
      rates,
    )

    const asset = await assetsRepo.create({
      id,
      kind: 'non_liquid',
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      current_balance: String(parsed.data.current_balance),
      satuan: parsed.data.satuan,
      price_symbol: parsed.data.price_symbol,
      bank_name: '',
      account_number: '',
      color: parsed.data.color,
      icon: parsed.data.icon,
      notes: parsed.data.notes,
      include_in_saldo: parsed.data.include_in_saldo ? 'true' : 'false',
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
      value_idr,
    })

    // Record initial balance as first mutation
    if (parsed.data.current_balance > 0) {
      await assetMutationsRepo.create({
        id: generateId('asset_mutation'),
        asset_id: id,
        mutation_type: 'increase',
        mutation_category: 'penyesuaian_saldo',
        previous_balance: '0',
        delta: String(parsed.data.current_balance),
        new_balance: String(parsed.data.current_balance),
        satuan: parsed.data.satuan,
        description: 'Saldo awal',
        created_by: member.id,
        created_at: now,
      })
    }

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'asset',
      entityId: id,
      after: asset,
    })

    return NextResponse.json(ok(asset), { status: 201 })
  } catch (err) {
    console.error('[assets POST]', err)
    return NextResponse.json(fail('Gagal menyimpan aset'), { status: 500 })
  }
}
