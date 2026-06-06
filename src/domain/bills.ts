import type { Bill, BillPayment } from './types'

export type BillStatus = 'paid' | 'unpaid' | 'due-soon' | 'overdue'

/**
 * Canonical bill status. A bill counts as `paid` when a payment exists for the
 * given month (`YYYY-MM`); otherwise it is classified by how close its due date
 * is to today. This is the single source of truth shared by the Tagihan page
 * and the dashboard Ringkasan card so both always agree.
 */
export function getBillStatus(
  bill: Bill,
  payments: BillPayment[],
  month: string,
): BillStatus {
  const isPaid = payments.some(
    (p) => p.bill_id === bill.id && p.paid_at.startsWith(month),
  )
  if (isPaid) return 'paid'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(bill.due_date)
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) return 'overdue'
  if (diffDays <= 7) return 'due-soon'
  return 'unpaid'
}

/** `YYYY-MM` for the month a due date falls in. */
export function billDueMonth(bill: Bill): string {
  return bill.due_date.slice(0, 7)
}
