import { ACCOUNT_TYPE_LABELS, ASSET_TYPE_LABELS, ASSET_TYPE_ICONS, ASSET_TYPE_COLORS, LIQUID_ACCOUNT_TYPES } from '@/domain/constants'
import type { Account, Asset } from '@/domain/types'

export interface RegistryItem {
  kind: 'account' | 'asset'
  id: string
  name: string
  subLabel?: string
  typeLabel: string
  value: number
  includeInSaldo: boolean
  icon: string
  color: string
  raw: Account | Asset
}

export function buildRegistryData(accounts: Account[], assets: Asset[]) {
  const liquidAccounts = accounts.filter((a) =>
    (LIQUID_ACCOUNT_TYPES as readonly string[]).includes(a.type),
  )

  const liquidItems: RegistryItem[] = liquidAccounts.map((account) => ({
    kind: 'account',
    id: account.id,
    name: account.name,
    subLabel: account.bank_name || undefined,
    typeLabel: ACCOUNT_TYPE_LABELS[account.type] ?? account.type,
    value: parseInt(account.current_balance, 10) || 0,
    includeInSaldo: account.include_in_saldo !== 'false',
    icon: account.icon ?? ASSET_TYPE_ICONS[account.type] ?? 'wallet',
    color: account.color ?? ASSET_TYPE_COLORS[account.type] ?? '#1e40af',
    raw: account,
  }))

  const nonLiquidItems: RegistryItem[] = assets.map((asset) => ({
    kind: 'asset',
    id: asset.id,
    name: asset.name,
    typeLabel: ASSET_TYPE_LABELS[asset.type] ?? asset.type,
    value: parseInt(asset.value, 10) || 0,
    includeInSaldo: asset.include_in_saldo === 'true',
    icon: asset.icon ?? ASSET_TYPE_ICONS[asset.type] ?? 'briefcase',
    color: asset.color ?? ASSET_TYPE_COLORS[asset.type] ?? '#64748b',
    raw: asset,
  }))

  const liquidGroups: Record<string, RegistryItem[]> = {}
  for (const item of liquidItems) {
    ;(liquidGroups[item.typeLabel] = liquidGroups[item.typeLabel] || []).push(item)
  }

  const nonLiquidGroups: Record<string, RegistryItem[]> = {}
  for (const item of nonLiquidItems) {
    ;(nonLiquidGroups[item.typeLabel] = nonLiquidGroups[item.typeLabel] || []).push(item)
  }

  const combined = [...liquidItems, ...nonLiquidItems]
  const totalSaldo = combined
    .filter((item) => item.includeInSaldo)
    .reduce((sum, item) => sum + item.value, 0)
  const totalNilai = combined.reduce((sum, item) => sum + item.value, 0)

  return {
    liquidItems,
    nonLiquidItems,
    liquidGroups,
    nonLiquidGroups,
    // Legacy aliases used by aset page
    accountGroups: liquidGroups,
    assetGroups: nonLiquidGroups,
    accountItems: liquidItems,
    assetItems: nonLiquidItems,
    totalSaldo,
    totalNilai,
    hasItems: combined.length > 0,
  }
}
