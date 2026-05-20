'use client'

import { useMemo } from 'react'
import { CategoryDonut } from '@/components/finance/category-donut'
import { formatMoneyCompact } from '@/lib/money'
import { groupByField, topN } from '@/domain/transactions'
import type { Transaction, TransactionCategory, Asset } from '@/domain/types'

const PALETTE = [
  '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa',
  '#fb7185', '#4ade80', '#fb923c', '#38bdf8', '#e879f9',
]

type Slice = { label: string; amount: number; color: string }

function buildSlices(
  transactions: Transaction[],
  type: 'expense' | 'income',
  groupBy: 'category' | 'account',
  categories: TransactionCategory[],
  accounts: Asset[],
  maxSlices = 7,
): Slice[] {
  const txType = type === 'income' ? null : 'expense'
  const txs =
    type === 'income'
      ? transactions.filter((tx) => tx.type === 'income' || tx.type === 'refund')
      : transactions.filter((tx) => tx.type === 'expense')

  const map = groupByField(txs, groupBy === 'category' ? 'category_id' : 'account_id', txType)
  const top = topN(map, maxSlices)

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const accMap = Object.fromEntries(accounts.map((a) => [a.id, a]))

  const slices: Slice[] = []
  let othersTotal = 0
  const allEntries = Object.entries(map).sort(([, a], [, b]) => b - a)

  allEntries.forEach(([id, amount], i) => {
    if (i < maxSlices) {
      const label =
        groupBy === 'category'
          ? (catMap[id]?.name ?? 'Tanpa Kategori')
          : (accMap[id]?.name ?? 'Akun Tidak Dikenal')
      const color =
        groupBy === 'category'
          ? (catMap[id]?.color ?? PALETTE[i % PALETTE.length])
          : (accMap[id]?.color ?? PALETTE[i % PALETTE.length])
      slices.push({ label, amount, color })
    } else {
      othersTotal += amount
    }
  })

  if (othersTotal > 0) {
    slices.push({ label: 'Lainnya', amount: othersTotal, color: '#94a3b8' })
  }

  void top
  return slices
}

function DonutCard({
  title,
  slices,
  total,
}: {
  title: string
  slices: Slice[]
  total: number
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold text-muted-foreground mb-3">{title}</p>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <CategoryDonut
          slices={slices}
          size={130}
          centerLabel="Total"
          centerValue={formatMoneyCompact(total)}
        />
        <div className="flex-1 min-w-0 space-y-1.5 w-full sm:w-auto">
          {slices.map((s, i) => {
            const pct = total > 0 ? Math.round((s.amount / total) * 100) : 0
            return (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate text-[11.5px] font-medium flex-1 min-w-0">{s.label}</span>
                <span className="tabular-nums text-[11px] text-muted-foreground shrink-0">
                  {pct}%
                </span>
                <span className="tabular-nums text-[11.5px] font-semibold shrink-0">
                  {formatMoneyCompact(s.amount)}
                </span>
              </div>
            )
          })}
          {slices.length === 0 && (
            <p className="text-[11px] text-muted-foreground">Tidak ada data</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ReportDonutSection({
  transactions,
  categories,
  accounts,
  groupBy,
}: {
  transactions: Transaction[]
  categories: TransactionCategory[]
  accounts: Asset[]
  groupBy: 'category' | 'account'
}) {
  const expenseSlices = useMemo(
    () => buildSlices(transactions, 'expense', groupBy, categories, accounts),
    [transactions, groupBy, categories, accounts],
  )
  const incomeSlices = useMemo(
    () => buildSlices(transactions, 'income', groupBy, categories, accounts),
    [transactions, groupBy, categories, accounts],
  )

  const totalExpense = expenseSlices.reduce((s, sl) => s + sl.amount, 0)
  const totalIncome = incomeSlices.reduce((s, sl) => s + sl.amount, 0)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-5">
        <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Distribusi
        </p>
        <p className="font-bold text-[15px] tracking-tight mt-0.5">
          Per {groupBy === 'category' ? 'Kategori' : 'Akun'}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <DonutCard title="Pengeluaran" slices={expenseSlices} total={totalExpense} />
        <div className="w-full h-px bg-border" />
        <DonutCard title="Pemasukan" slices={incomeSlices} total={totalIncome} />
      </div>
    </div>
  )
}
