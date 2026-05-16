import { ACCOUNT_TYPE_LABELS, ASSET_TYPE_LABELS } from '@/domain/constants'
import type { Account, Asset } from '@/domain/types'

export interface RegistryItem {
  kind: 'account' | 'asset'
  id: string
  name: string
  subLabel?: string
  typeLabel: string
  value: number
  includeInSaldo: boolean
  raw: Account | Asset
}

export function buildRegistryData(accounts: Account[], assets: Asset[]) {
  const accountItems: RegistryItem[] = accounts.map((account) => ({
    kind: 'account',
    id: account.id,
    name: account.name,
    subLabel: account.bank_name || undefined,
    typeLabel: ACCOUNT_TYPE_LABELS[account.type] ?? account.type,
    value: parseInt(account.current_balance, 10) || 0,
    includeInSaldo: account.include_in_saldo !== 'false',
    raw: account,
  }))

  const assetItems: RegistryItem[] = assets.map((asset) => ({
    kind: 'asset',
    id: asset.id,
    name: asset.name,
    typeLabel: ASSET_TYPE_LABELS[asset.type] ?? asset.type,
    value: parseInt(asset.value, 10) || 0,
    includeInSaldo: asset.include_in_saldo === 'true',
    raw: asset,
  }))

  const accountGroups: Record<string, RegistryItem[]> = {}
  for (const item of accountItems) {
    ;(accountGroups[item.typeLabel] = accountGroups[item.typeLabel] || []).push(item)
  }

  const assetGroups: Record<string, RegistryItem[]> = {}
  for (const item of assetItems) {
    ;(assetGroups[item.typeLabel] = assetGroups[item.typeLabel] || []).push(item)
  }

  const combined = [...accountItems, ...assetItems]
  const totalSaldo = combined
    .filter((item) => item.includeInSaldo)
    .reduce((sum, item) => sum + item.value, 0)
  const totalNilai = combined.reduce((sum, item) => sum + item.value, 0)

  return {
    accountItems,
    assetItems,
    accountGroups,
    assetGroups,
    totalSaldo,
    totalNilai,
    hasItems: combined.length > 0,
  }
}
