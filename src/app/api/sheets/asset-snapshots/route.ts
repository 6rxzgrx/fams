import { NextResponse } from 'next/server'
import { getSessionMember } from '@/lib/api-helpers'
import { assetSnapshotsRepo } from '@/integrations/sheets/repositories/asset-snapshots'
import { ok, fail } from '@/domain/types'

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
