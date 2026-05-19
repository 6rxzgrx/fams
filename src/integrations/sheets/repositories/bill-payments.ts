import { SheetRepository } from '../repository'
import type { BillPayment } from '@/domain/types'

export class BillPaymentsRepository extends SheetRepository<BillPayment> {
  constructor() {
    super('bill_payments')
  }

  async findByBillId(billId: string): Promise<BillPayment[]> {
    const all = await this.findAll()
    return all.filter((p) => p.bill_id === billId)
  }

  async findByMonth(month: string): Promise<BillPayment[]> {
    const all = await this.findAll()
    return all.filter((p) => p.paid_at?.startsWith(month))
  }
}

export const billPaymentsRepo = new BillPaymentsRepository()
