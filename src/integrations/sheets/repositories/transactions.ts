import { SheetRepository } from '../repository'
import type { Transaction } from '@/domain/types'

export class TransactionsRepository extends SheetRepository<Transaction> {
  constructor() {
    super('transactions')
  }

  async findByAccount(accountId: string): Promise<Transaction[]> {
    return this.findByField('account_id', accountId)
  }

  async findRecent(limit = 20): Promise<Transaction[]> {
    const all = await this.findAll()
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  async findByDateRange(from: string, to: string): Promise<Transaction[]> {
    const all = await this.findAll()
    return all.filter((t) => t.date >= from && t.date <= to)
  }
}

export const transactionsRepo = new TransactionsRepository()
