import { SheetRepository } from '../repository'
import type { Bill } from '@/domain/types'

export class BillsRepository extends SheetRepository<Bill> {
  constructor() {
    super('bills')
  }
}

export const billsRepo = new BillsRepository()
