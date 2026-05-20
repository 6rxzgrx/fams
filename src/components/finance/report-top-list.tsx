'use client'

import { CategoryIcon } from '@/components/finance/category-icon'
import { formatMoney } from '@/lib/money'
import type { Transaction, TransactionCategory, Asset } from '@/domain/types'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

function TopItem({
  rank,
  tx,
  category,
  account,
}: {
  rank: number
  tx: Transaction
  category?: TransactionCategory
  account?: Asset
}) {
  const amount = parseInt(tx.amount, 10) || 0
  const color = category?.color ?? '#64748b'
  const icon = category?.icon ?? 'tag'

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="text-[11px] font-bold tabular-nums text-muted-foreground w-5 text-center shrink-0">
        {rank}
      </span>
      <span
        className="size-9 shrink-0 rounded-xl flex items-center justify-center"
        style={{ background: `${color}1f`, color }}
      >
        <CategoryIcon icon={icon} className="size-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] font-semibold">{tx.description}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {account?.name ?? '—'} ·{' '}
          {format(new Date(tx.date), 'd MMM', { locale: idLocale })}
        </p>
      </div>
      <span className="tabular-nums font-bold text-[13.5px] tracking-tight shrink-0">
        {formatMoney(amount)}
      </span>
    </div>
  )
}

export function ReportTopList({
  transactions,
  categories,
  accounts,
  type,
  limit = 5,
}: {
  transactions: Transaction[]
  categories: TransactionCategory[]
  accounts: Asset[]
  type: 'expense' | 'income'
  limit?: number
}) {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]))
  const accMap = Object.fromEntries(accounts.map((a) => [a.id, a]))

  const topTxs = transactions
    .filter((tx) =>
      type === 'income' ? tx.type === 'income' || tx.type === 'refund' : tx.type === 'expense',
    )
    .sort((a, b) => parseInt(b.amount, 10) - parseInt(a.amount, 10))
    .slice(0, limit)

  if (!topTxs.length) {
    return (
      <p className="text-[12px] text-muted-foreground py-4 text-center">
        Belum ada {type === 'expense' ? 'pengeluaran' : 'pemasukan'}
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {topTxs.map((tx, i) => (
        <TopItem
          key={tx.id}
          rank={i + 1}
          tx={tx}
          category={catMap[tx.category_id ?? '']}
          account={accMap[tx.account_id]}
        />
      ))}
    </div>
  )
}
