import type { Transaction, TransactionCategory, TransactionType } from './types'

export type DailyBar = { day: number; income: number; expense: number; transfer: number }
export type MonthTrend = { label: string; income: number; expense: number; ym: string }

// Returns the signed delta to apply to an account's current_balance.
// 'transfer' returns 0 — the transfer route handles both sides explicitly.
// 'adjustment' returns 0 — manual balance edits handle that directly.
export function computeBalanceDelta(type: TransactionType, amount: number): number {
  if (type === 'income' || type === 'refund') return amount
  if (type === 'expense') return -amount
  return 0
}

export function computeBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    const amount = parseInt(tx.amount, 10) || 0
    if (tx.type === 'income' || tx.type === 'refund') return sum + amount
    if (tx.type === 'expense') return sum - amount
    return sum
  }, 0)
}

export function groupByDate(transactions: Transaction[]): Record<string, Transaction[]> {
  return transactions.reduce<Record<string, Transaction[]>>((groups, tx) => {
    const date = tx.date
    groups[date] = groups[date] ?? []
    groups[date].push(tx)
    return groups
  }, {})
}

export function sumByType(transactions: Transaction[]): Record<TransactionType, number> {
  const result = { income: 0, expense: 0, transfer: 0, adjustment: 0, refund: 0 }
  for (const tx of transactions) {
    result[tx.type] = (result[tx.type] ?? 0) + (parseInt(tx.amount, 10) || 0)
  }
  return result
}

export function getMonthRange(year: number, month: number): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(lastDay)}`,
  }
}

export const TX_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  transfer: 'Transfer',
  adjustment: 'Penyesuaian',
  refund: 'Pengembalian',
}

export function groupByField(
  transactions: Transaction[],
  field: 'category_id' | 'account_id',
  type: TransactionType | null,
): Record<string, number> {
  const filtered = type ? transactions.filter((tx) => tx.type === type) : transactions
  return filtered.reduce<Record<string, number>>((acc, tx) => {
    const key = (tx[field] as string) || '__unknown__'
    acc[key] = (acc[key] ?? 0) + (parseInt(tx.amount, 10) || 0)
    return acc
  }, {})
}

export function topN(
  map: Record<string, number>,
  n: number,
): Array<{ id: string; amount: number }> {
  return Object.entries(map)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n)
}

export function getLast12Months(currentYM: string): Array<{
  year: number
  month: number
  label: string
  ym: string
}> {
  const [y, m] = currentYM.split('-').map(Number)
  const result = []
  for (let i = 11; i >= 0; i--) {
    let year = y
    let month = m - i
    while (month <= 0) {
      month += 12
      year -= 1
    }
    const label = new Date(year, month - 1, 1).toLocaleDateString('id-ID', {
      month: 'short',
      year: '2-digit',
    })
    result.push({ year, month, label, ym: `${year}-${String(month).padStart(2, '0')}` })
  }
  return result
}

export function buildDailyBars(
  transactions: Transaction[],
  year: number,
  month: number,
): DailyBar[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const map: Record<number, DailyBar> = {}
  for (const tx of transactions) {
    const day = parseInt(tx.date.slice(8, 10), 10)
    if (!map[day]) map[day] = { day, income: 0, expense: 0, transfer: 0 }
    const amt = parseInt(tx.amount, 10) || 0
    if (tx.type === 'income' || tx.type === 'refund') map[day].income += amt
    else if (tx.type === 'expense') map[day].expense += amt
    else if (tx.type === 'transfer') map[day].transfer += amt
  }
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    return map[d] ?? { day: d, income: 0, expense: 0, transfer: 0 }
  })
}

// Sums expense spend for a budget type, including child categories whose
// parent has that budget_type. budget_type is only set on parent categories
// (parent_id === ''); children inherit it.
export function spentForType(
  bt: string,
  categories: TransactionCategory[],
  spentByCategory: Record<string, number>,
): number {
  const parentIds = new Set(
    categories
      .filter((c) => c.type === 'expense' && !c.parent_id && c.budget_type === bt && !c.deleted_at)
      .map((c) => c.id),
  )
  return categories
    .filter(
      (c) =>
        c.type === 'expense' &&
        !c.deleted_at &&
        (parentIds.has(c.id) || (!!c.parent_id && parentIds.has(c.parent_id))),
    )
    .reduce((sum, c) => sum + (spentByCategory[c.id] ?? 0), 0)
}
