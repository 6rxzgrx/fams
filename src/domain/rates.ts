import type { PriceRate } from './types'

const TROY_OZ_TO_GRAM = 31.1035

/**
 * Converts a non-rupiah asset quantity to IDR.
 * For XAU: value is in grams → uses XAU_USD + USD_IDR rates.
 * For all other symbols: expects a direct IDR-per-unit rate entry.
 * Returns null when required rates are missing.
 */
export function convertAssetToIdr(
  value: number,
  priceSymbol: string,
  rates: PriceRate[],
): number | null {
  if (!priceSymbol || value <= 0) return null

  if (priceSymbol === 'XAU') {
    const xauUsdRate = rates.find((r) => r.symbol === 'XAU_USD')
    const usdIdrRate = rates.find((r) => r.symbol === 'USD_IDR')
    const xauUsd = xauUsdRate ? parseFloat(xauUsdRate.value_idr_per_unit) : 0
    const usdIdr = usdIdrRate ? parseFloat(usdIdrRate.value_idr_per_unit) : 0
    if (!xauUsd || !usdIdr) return null
    return value * (xauUsd / TROY_OZ_TO_GRAM) * usdIdr
  }

  const rate = rates.find((r) => r.symbol === priceSymbol)
  if (!rate) return null
  const rateValue = parseFloat(rate.value_idr_per_unit)
  if (!rateValue) return null
  return value * rateValue
}

/**
 * Computes the IDR value of a non-liquid asset and returns it as a string integer.
 * For rupiah-denominated assets the balance is already IDR.
 * Returns '0' when conversion is not possible (missing rates).
 */
export function computeValueIdr(
  balance: number,
  satuan: string,
  priceSymbol: string,
  rates: PriceRate[],
): string {
  if (!satuan || satuan === 'rupiah' || !priceSymbol) return String(Math.round(balance))
  const idr = convertAssetToIdr(balance, priceSymbol, rates)
  return idr != null ? String(Math.round(idr)) : '0'
}

export function isRateStale(updatedAt: string, maxAgeMs = 60 * 60 * 1000): boolean {
  const age = Date.now() - new Date(updatedAt).getTime()
  return age > maxAgeMs
}
