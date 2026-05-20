import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { priceRatesRepo } from '@/integrations/sheets/repositories/price-rates'
import { computeValueIdr } from '@/domain/rates'

/**
 * Re-computes and persists value_idr for all non-liquid assets whose
 * price_symbol matches the given symbol. Called after a rate is updated.
 */
export async function syncValueIdrBySymbol(symbol: string): Promise<void> {
  const [allAssets, allRates] = await Promise.all([
    assetsRepo.findAll(),
    priceRatesRepo.findAll(),
  ])

  const affected = allAssets.filter(
    (a) => !a.deleted_at && a.kind === 'non_liquid' && a.price_symbol === symbol,
  )

  await Promise.all(
    affected.map((a) => {
      const value_idr = computeValueIdr(
        parseFloat(a.current_balance) || 0,
        a.satuan ?? 'rupiah',
        a.price_symbol ?? '',
        allRates,
      )
      return assetsRepo.update(a.id, { value_idr })
    }),
  )
}
