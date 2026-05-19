import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { generateId } from '@/lib/ulid'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { assetSnapshotsRepo } from '@/integrations/sheets/repositories/asset-snapshots'
import { priceRatesRepo } from '@/integrations/sheets/repositories/price-rates'
import { convertAssetToIdr } from '@/domain/rates'
import { ok, fail } from '@/domain/types'
import type { AssetSnapshot } from '@/domain/types'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(fail('Unauthorized'), { status: 401 })
  }

  const [allAssets, rates] = await Promise.all([
    assetsRepo.findAll(),
    priceRatesRepo.findAll(),
  ])

  const liquid = allAssets.filter((a) => a.kind === 'liquid')
  const nonLiquid = allAssets.filter((a) => a.kind === 'non_liquid')

  const liquidTotal = liquid.reduce(
    (sum, a) => sum + (parseInt(a.current_balance, 10) || 0),
    0,
  )

  const nonLiquidTotal = nonLiquid.reduce((sum, a) => {
    const val = parseFloat(a.current_balance) || 0
    if (a.satuan === 'rupiah') return sum + val
    const idr = a.price_symbol ? convertAssetToIdr(val, a.price_symbol, rates) : null
    return idr != null ? sum + idr : sum
  }, 0)

  const now = new Date()
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const snapshot: AssetSnapshot = {
    id: generateId('snapshot'),
    month,
    liquid_total: String(liquidTotal),
    non_liquid_total: String(Math.round(nonLiquidTotal)),
    snapshot_at: now.toISOString(),
  }

  const saved = await assetSnapshotsRepo.upsert(snapshot)
  return NextResponse.json(ok(saved))
}
