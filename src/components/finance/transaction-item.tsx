'use client'

import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RotateCcw,
  Equal,
  type LucideIcon,
} from 'lucide-react'
import type { Transaction, TransactionCategory } from '@/domain/types'
import { formatCategoryLabel } from '@/domain/categories'
import { MoneyDisplay } from './money-display'
import { TX_TYPE_LABELS } from '@/domain/transactions'

interface TransactionItemProps {
  transaction: Transaction
  categories: TransactionCategory[]
  onClick?: () => void
}

const TYPE_META: Record<string, { Icon: LucideIcon; tone: string }> = {
  income:     { Icon: ArrowDownLeft,  tone: 'bg-success-soft text-success' },
  expense:    { Icon: ArrowUpRight,   tone: 'bg-muted text-foreground' },
  transfer:   { Icon: ArrowLeftRight, tone: 'bg-info-soft text-info' },
  refund:     { Icon: RotateCcw,      tone: 'bg-success-soft text-success' },
  adjustment: { Icon: Equal,          tone: 'bg-warning-soft text-warning' },
}

export function TransactionItem({ transaction, categories, onClick }: TransactionItemProps) {
  const category = categories.find((c) => c.id === transaction.category_id)
  const meta = TYPE_META[transaction.type] ?? { Icon: Equal, tone: 'bg-muted text-muted-foreground' }
  const { Icon, tone } = meta

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/60 active:bg-muted focus-visible:outline-none"
    >
      <span
        className={`inline-flex size-10 shrink-0 items-center justify-center rounded-pill ${tone}`}
        aria-hidden="true"
      >
        <Icon className="size-[18px]" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-foreground">{transaction.description}</p>
        <p className="text-[12px] text-muted-foreground">
          {category ? formatCategoryLabel(category, categories) : TX_TYPE_LABELS[transaction.type]}
          {' · '}
          {format(new Date(transaction.date), 'd MMMM yyyy', { locale: id })}
        </p>
      </div>
      <MoneyDisplay
        amount={parseInt(transaction.amount, 10)}
        type={transaction.type}
        className="shrink-0 text-[15px]"
      />
    </button>
  )
}
