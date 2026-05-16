import { SheetRepository } from '../repository'
import type { Account } from '@/domain/types'

export class AccountsRepository extends SheetRepository<Account> {
  constructor() {
    super('accounts')
  }

  // Apply a signed delta to current_balance (positive = credit, negative = debit).
  async applyBalanceDelta(id: string, delta: number): Promise<void> {
    if (delta === 0) return
    const account = await this.findById(id)
    if (!account) return
    const current = parseInt(account.current_balance, 10) || 0
    await this.update(id, { current_balance: String(current + delta) })
  }
}

export const accountsRepo = new AccountsRepository()
