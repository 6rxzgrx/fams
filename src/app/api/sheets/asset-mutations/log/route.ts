import { NextResponse } from 'next/server'
import { assetMutationsRepo } from '@/integrations/sheets/repositories/asset-mutations'
import { auditLogsRepo } from '@/integrations/sheets/repositories/audit-logs'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { familyMembersRepo } from '@/integrations/sheets/repositories/family-members'
import { ok, fail } from '@/domain/types'
import { canRead } from '@/domain/permissions'
import { getSessionMember } from '@/lib/api-helpers'

export type MutasiLogEntry = {
  id: string
  kind: 'balance' | 'edit' | 'create' | 'delete'
  asset_id: string
  asset_name: string
  asset_color: string
  asset_icon: string
  description: string
  delta?: string
  new_balance?: string
  satuan?: string
  changes?: { field: string; before: string; after: string }[]
  created_by_id: string
  created_by_name: string
  created_at: string
}

const ASSET_FIELD_LABELS: Record<string, string> = {
  name: 'Nama',
  type: 'Tipe',
  current_balance: 'Nilai',
  satuan: 'Satuan',
  include_in_saldo: 'Hitung ke Saldo',
  notes: 'Catatan',
  color: 'Warna',
  icon: 'Ikon',
  price_symbol: 'Konverter',
}

const TRACKED_FIELDS = Object.keys(ASSET_FIELD_LABELS)

function diffAsset(before: Record<string, string>, after: Record<string, string>) {
  const changes: { field: string; before: string; after: string }[] = []
  for (const field of TRACKED_FIELDS) {
    const b = before[field] ?? ''
    const a = after[field] ?? ''
    if (b !== a) {
      changes.push({ field: ASSET_FIELD_LABELS[field], before: b, after: a })
    }
  }
  return changes
}

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM

  try {
    const [allAssets, mutations, auditLogs, members] = await Promise.all([
      assetsRepo.findAll(true),
      assetMutationsRepo.findAll(),
      auditLogsRepo.findByEntityTypes(['asset', 'account']),
      familyMembersRepo.findAll(),
    ])

    const assetMap = new Map(allAssets.map((a) => [a.id, a]))
    const memberMap = new Map(members.map((m) => [m.id, m.name]))

    const entries: MutasiLogEntry[] = []

    // Balance mutations
    for (const m of mutations) {
      if (month && !m.created_at.startsWith(month)) continue
      const asset = assetMap.get(m.asset_id)
      entries.push({
        id: m.id,
        kind: 'balance',
        asset_id: m.asset_id,
        asset_name: asset?.name ?? m.asset_id,
        asset_color: asset?.color ?? '#64748b',
        asset_icon: asset?.icon ?? 'briefcase',
        description: m.description || (parseFloat(m.delta) >= 0 ? 'Penambahan nilai' : 'Pengurangan nilai'),
        delta: m.delta,
        new_balance: m.new_balance,
        satuan: m.satuan,
        created_by_id: m.created_by,
        created_by_name: memberMap.get(m.created_by) ?? '',
        created_at: m.created_at,
      })
    }

    // Audit log entries (create / update / delete)
    for (const log of auditLogs) {
      if (month && !log.created_at.startsWith(month)) continue

      const assetId = log.entity_id
      let asset = assetMap.get(assetId)

      // Try to get asset info from audit log data if not in current list
      if (!asset && log.after_data) {
        try {
          const after = JSON.parse(log.after_data) as Record<string, string>
          asset = { id: assetId, name: after.name ?? assetId, color: after.color ?? '#64748b', icon: after.icon ?? 'briefcase' } as unknown as typeof asset
        } catch { /* ignore */ }
      }
      if (!asset && log.before_data) {
        try {
          const before = JSON.parse(log.before_data) as Record<string, string>
          asset = { id: assetId, name: before.name ?? assetId, color: before.color ?? '#64748b', icon: before.icon ?? 'briefcase' } as unknown as typeof asset
        } catch { /* ignore */ }
      }

      if (log.action === 'update') {
        let changes: { field: string; before: string; after: string }[] = []
        if (log.before_data && log.after_data) {
          try {
            const before = JSON.parse(log.before_data) as Record<string, string>
            const after = JSON.parse(log.after_data) as Record<string, string>
            // Skip pure balance-change edits — those are already captured as balance mutations
            changes = diffAsset(before, after).filter((c) => c.field !== ASSET_FIELD_LABELS.current_balance)
          } catch { /* ignore */ }
        }
        if (changes.length === 0) continue // nothing worth showing

        entries.push({
          id: log.id,
          kind: 'edit',
          asset_id: assetId,
          asset_name: asset?.name ?? assetId,
          asset_color: asset?.color ?? '#64748b',
          asset_icon: asset?.icon ?? 'briefcase',
          description: 'Edit aset',
          changes,
          created_by_id: log.member_id,
          created_by_name: log.member_name,
          created_at: log.created_at,
        })
      } else if (log.action === 'create') {
        entries.push({
          id: log.id,
          kind: 'create',
          asset_id: assetId,
          asset_name: asset?.name ?? assetId,
          asset_color: asset?.color ?? '#64748b',
          asset_icon: asset?.icon ?? 'briefcase',
          description: 'Aset ditambahkan',
          created_by_id: log.member_id,
          created_by_name: log.member_name,
          created_at: log.created_at,
        })
      } else if (log.action === 'delete') {
        entries.push({
          id: log.id,
          kind: 'delete',
          asset_id: assetId,
          asset_name: asset?.name ?? assetId,
          asset_color: asset?.color ?? '#64748b',
          asset_icon: asset?.icon ?? 'briefcase',
          description: 'Aset dihapus',
          created_by_id: log.member_id,
          created_by_name: log.member_name,
          created_at: log.created_at,
        })
      }
    }

    // Sort newest first
    entries.sort((a, b) => b.created_at.localeCompare(a.created_at))

    return NextResponse.json(ok(entries))
  } catch (err) {
    console.error('[asset-mutations/log GET]', err)
    return NextResponse.json(fail('Gagal memuat log mutasi'), { status: 500 })
  }
}
