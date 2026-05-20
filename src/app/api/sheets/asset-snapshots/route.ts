import { NextResponse } from 'next/server'
import { getSessionMember } from '@/lib/api-helpers'
import { assetSnapshotsRepo } from '@/integrations/sheets/repositories/asset-snapshots'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(req: Request) {
  const { error } = await getSessionMember()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const months = Math.min(24, Math.max(1, parseInt(searchParams.get('months') ?? '6', 10)))

  try {
    const snapshots = await assetSnapshotsRepo.findRecent(months)
    return NextResponse.json(ok(snapshots))
  } catch (e) {
    console.error('[asset-snapshots] GET error', e)
    return NextResponse.json(fail('Gagal mengambil data snapshot'), { status: 500 })
  }
}

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
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
    const body = await req.json().catch(() => ({}))
    const now = new Date()
    const month =
      typeof body.month === 'string' && /^\d{4}-\d{2}$/.test(body.month)
        ? body.month
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const allAssets = await assetsRepo.findAll()
    // Snapshot covers all non-deleted assets regardless of include_in_saldo — total wealth view
    const active = allAssets.filter((a) => !a.deleted_at)
    const liquidTotal = active
      .filter((a) => a.kind === 'liquid')
      .reduce((s, a) => s + (parseInt(a.current_balance, 10) || 0), 0)
    // Non-liquid uses value_idr (pre-computed IDR from converter); avoids incorrect raw-unit summation
    const nonLiquidTotal = active
      .filter((a) => a.kind === 'non_liquid')
      .reduce((s, a) => s + (parseInt(a.value_idr ?? '0', 10) || 0), 0)

    const snapshot = await assetSnapshotsRepo.upsert({
      id: generateId('snap'),
      month,
      liquid_total: String(liquidTotal),
      non_liquid_total: String(nonLiquidTotal),
      snapshot_at: now.toISOString(),
    })

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'asset_snapshot',
      entityId: snapshot.id,
      after: snapshot,
    })

    return NextResponse.json(ok(snapshot), { status: 201 })
  } catch (e) {
    console.error('[asset-snapshots] POST error', e)
    return NextResponse.json(fail('Gagal menyimpan snapshot'), { status: 500 })
  }
}
