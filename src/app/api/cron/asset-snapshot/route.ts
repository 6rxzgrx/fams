import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { generateId } from '@/lib/ulid'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { assetSnapshotsRepo } from '@/integrations/sheets/repositories/asset-snapshots'
import { LIQUID_ACCOUNT_TYPES } from '@/domain/constants'
import { ok, fail } from '@/domain/types'
import type { AssetSnapshot } from '@/domain/types'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const secret = env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json(fail('Unauthorized'), { status: 401 })
  }

  const [accounts, assets] = await Promise.all([
    accountsRepo.findAll(),
    assetsRepo.findAll(),
  ])

  const liquidTotal = accounts
    .filter(
      (a) =>
        (LIQUID_ACCOUNT_TYPES as readonly string[]).includes(a.type) &&
        a.include_in_saldo !== 'false',
    )
    .reduce((sum, a) => sum + (parseInt(a.current_balance, 10) || 0), 0)

  const nonLiquidTotal = assets
    .filter((a) => a.satuan === 'rupiah')
    .reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0)

  const now = new Date()
  const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const snapshot: AssetSnapshot = {
    id: generateId('snapshot'),
    month,
    liquid_total: String(liquidTotal),
    non_liquid_total: String(nonLiquidTotal),
    snapshot_at: now.toISOString(),
  }

  const saved = await assetSnapshotsRepo.upsert(snapshot)
  return NextResponse.json(ok(saved))
}
