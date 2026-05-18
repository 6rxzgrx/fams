'use client'

import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RotateCcw,
  Equal,
  MoreVertical,
  type LucideIcon,
} from 'lucide-react'
import type { Transaction, TransactionCategory } from '@/domain/types'
import { formatCategoryLabel } from '@/domain/categories'
import { MoneyDisplay } from './money-display'
import { TX_TYPE_LABELS } from '@/domain/transactions'
import { cn } from '@/lib/utils'

interface TransactionItemProps {
  transaction: Transaction
  categories: TransactionCategory[]
  onClick?: () => void
  onMenu?: () => void
  selected?: boolean
}

const TYPE_META: Record<string, { Icon: LucideIcon; tone: string }> = {
  income:     { Icon: ArrowDownLeft,  tone: 'bg-success-soft text-success' },
  expense:    { Icon: ArrowUpRight,   tone: 'bg-muted text-foreground' },
  transfer:   { Icon: ArrowLeftRight, tone: 'bg-info-soft text-info' },
  refund:     { Icon: RotateCcw,      tone: 'bg-success-soft text-success' },
  adjustment: { Icon: Equal,          tone: 'bg-warning-soft text-warning' },
}

export function TransactionItem({ transaction, categories, onClick, onMenu, selected }: TransactionItemProps) {
  const category = categories.find((c) => c.id === transaction.category_id)
  const meta = TYPE_META[transaction.type] ?? { Icon: Equal, tone: 'bg-muted text-muted-foreground' }
  const { Icon, tone } = meta

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 transition-colors duration-150',
        'hover:bg-muted',
        selected && 'bg-accent-soft',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center gap-3 py-3 text-left focus-visible:outline-none"
      >
        <span
          className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-md', tone)}
          aria-hidden="true"
        >
          <Icon className="size-[18px]" strokeWidth={1.75} />
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
      {onMenu && (
        <button
          type="button"
          onClick={onMenu}
          aria-label="Tindakan transaksi"
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md text-muted-foreground',
            'transition-opacity duration-150 hover:bg-border-strong/40 hover:text-foreground',
            'lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100',
          )}
        >
          <MoreVertical className="size-4" strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
