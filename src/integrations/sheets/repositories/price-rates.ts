import { SheetRepository } from '../repository'
import type { PriceRate } from '@/domain/types'

export class PriceRatesRepository extends SheetRepository<PriceRate> {
  constructor() {
    super('price_rates')
  }

  async findBySymbol(symbol: string): Promise<PriceRate | null> {
    const all = await this.findAll()
    return all.find((r) => r.symbol === symbol) ?? null
  }
}

export const priceRatesRepo = new PriceRatesRepository()
