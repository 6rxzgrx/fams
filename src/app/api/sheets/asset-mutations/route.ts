import { NextResponse } from 'next/server'
import { assetMutationsRepo } from '@/integrations/sheets/repositories/asset-mutations'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { familyMembersRepo } from '@/integrations/sheets/repositories/family-members'
import { ok, fail } from '@/domain/types'
import { canRead } from '@/domain/permissions'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get('asset_id')

  try {
    const [mutations, allAssets, members] = await Promise.all([
      assetId ? assetMutationsRepo.findByAssetId(assetId) : assetMutationsRepo.findAll(),
      assetsRepo.findAll(true),
      familyMembersRepo.findAll(),
    ])

    const assetMap = new Map(allAssets.map((a) => [a.id, a]))
    const memberMap = new Map(members.map((m) => [m.id, m.name]))

    const enriched = mutations.map((m) => {
      const asset = assetMap.get(m.asset_id)
      return {
        ...m,
        asset_name: asset?.name ?? m.asset_id,
        asset_color: asset?.color ?? '#64748b',
        asset_icon: asset?.icon ?? 'briefcase',
        created_by_name: memberMap.get(m.created_by) ?? m.created_by,
      }
    })

    return NextResponse.json(ok(enriched))
  } catch (err) {
    console.error('[asset-mutations GET]', err)
    return NextResponse.json(fail('Gagal memuat riwayat mutasi'), { status: 500 })
  }
}
