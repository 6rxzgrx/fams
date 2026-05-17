import { SheetRepository } from '../repository'
import type { Budget } from '@/domain/types'

export class BudgetsRepository extends SheetRepository<Budget> {
  constructor() {
    super('budgets')
  }

  async findByMonth(month: string): Promise<Budget[]> {
    return this.findByField('month', month)
  }

  async upsert(month: string, categoryId: string, budgetType: string, data: Record<string, unknown>): Promise<Budget> {
    const existing = await this.findByMonth(month)
    const found = existing.find((b) => b.category_id === categoryId && (b.budget_type ?? '') === budgetType)
    if (found) {
      return (await this.update(found.id, data)) as Budget
    }
    return this.create(data) as Promise<Budget>
  }
}

export const budgetsRepo = new BudgetsRepository()
