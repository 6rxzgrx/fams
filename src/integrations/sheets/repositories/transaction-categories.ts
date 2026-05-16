import { SheetRepository } from '../repository'
import type { TransactionCategory } from '@/domain/types'

export class TransactionCategoriesRepository extends SheetRepository<TransactionCategory> {
  constructor() {
    super('transaction_categories')
  }

  async findByType(type: 'income' | 'expense' | 'transfer'): Promise<TransactionCategory[]> {
    const all = await this.findAll()
    return all.filter((c) => c.type === type)
  }
}

export const categoriesRepo = new TransactionCategoriesRepository()
