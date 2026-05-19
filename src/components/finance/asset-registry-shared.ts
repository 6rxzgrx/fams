import { ASSET_TYPE_LABELS, ASSET_TYPE_ICONS, ASSET_TYPE_COLORS, ASSET_TYPE_SATUAN, LIQUID_ASSET_TYPES } from '@/domain/constants'
import { convertAssetToIdr } from '@/domain/rates'
import type { Asset, PriceRate } from '@/domain/types'

export interface RegistryItem {
  kind: 'liquid' | 'non_liquid'
  id: string
  name: string
  subLabel?: string
  typeLabel: string
  value: number
  satuan: string
  idrValue?: number | null
  includeInSaldo: boolean
  icon: string
  color: string
  raw: Asset
}

export function buildRegistryData(
  assets: Asset[],
  rates: PriceRate[] = [],
) {
  const liquidItems: RegistryItem[] = assets
    .filter((a) => a.kind === 'liquid')
    .map((a) => ({
      kind: 'liquid' as const,
      id: a.id,
      name: a.name,
      subLabel: a.bank_name || undefined,
      typeLabel: ASSET_TYPE_LABELS[a.type] ?? a.type,
      value: parseInt(a.current_balance, 10) || 0,
      satuan: 'rupiah',
      includeInSaldo: a.include_in_saldo !== 'false',
      icon: a.icon ?? ASSET_TYPE_ICONS[a.type] ?? 'wallet',
      color: a.color ?? ASSET_TYPE_COLORS[a.type] ?? '#1e40af',
      raw: a,
    }))

  const nonLiquidItems: RegistryItem[] = assets
    .filter((a) => a.kind === 'non_liquid')
    .map((a) => {
      const satuan = a.satuan || ASSET_TYPE_SATUAN[a.type] || 'rupiah'
      const numValue = parseFloat(a.current_balance) || 0
      const idrValue =
        satuan !== 'rupiah' && a.price_symbol
          ? convertAssetToIdr(numValue, a.price_symbol, rates)
          : null

      return {
        kind: 'non_liquid' as const,
        id: a.id,
        name: a.name,
        typeLabel: ASSET_TYPE_LABELS[a.type] ?? a.type,
        value: numValue,
        satuan,
        idrValue,
        includeInSaldo: a.include_in_saldo === 'true',
        icon: a.icon ?? ASSET_TYPE_ICONS[a.type] ?? 'briefcase',
        color: a.color ?? ASSET_TYPE_COLORS[a.type] ?? '#64748b',
        raw: a,
      }
    })

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
    .reduce((sum, item) => {
      if (item.kind === 'liquid') return sum + item.value
      if (item.satuan === 'rupiah') return sum + item.value
      if (item.idrValue != null) return sum + item.idrValue
      return sum
    }, 0)

  const nonLiquidValue = nonLiquidItems.reduce((sum, item) => {
    if (item.satuan === 'rupiah') return sum + item.value
    if (item.idrValue != null) return sum + item.idrValue
    return sum
  }, 0)
  const totalNilai = liquidItems.reduce((sum, item) => sum + item.value, 0) + nonLiquidValue

  return {
    liquidItems,
    nonLiquidItems,
    liquidGroups,
    nonLiquidGroups,
    // Legacy aliases
    accountGroups: liquidGroups,
    assetGroups: nonLiquidGroups,
    accountItems: liquidItems,
    assetItems: nonLiquidItems,
    totalSaldo,
    totalNilai,
    hasItems: combined.length > 0,
  }
}

// Kept for any callers that still pass (accounts, assets) as separate arrays
export function buildRegistryDataLegacy(
  accounts: Asset[],
  assets: Asset[],
  rates: PriceRate[] = [],
) {
  return buildRegistryData([...accounts, ...assets], rates)
}

// Re-export type for convenience
export type { Asset as Account }
