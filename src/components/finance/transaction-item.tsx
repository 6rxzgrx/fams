'use client'

import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  RotateCcw,
  Equal,
  MoreVertical,
  type LucideIcon,
} from 'lucide-react'
import type { Transaction, TransactionCategory, Account } from '@/domain/types'
import { formatCategoryLabel } from '@/domain/categories'
import { MoneyDisplay } from './money-display'
import { TX_TYPE_LABELS } from '@/domain/transactions'
import { cn } from '@/lib/utils'

interface TransactionItemProps {
  transaction: Transaction
  categories: TransactionCategory[]
  accounts?: Account[]
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

export function TransactionItem({ transaction, categories, accounts, onClick, onMenu, selected }: TransactionItemProps) {
  const category = categories.find((c) => c.id === transaction.category_id)
  const account = accounts?.find((a) => a.id === transaction.account_id)
  const meta = TYPE_META[transaction.type] ?? { Icon: Equal, tone: 'bg-muted text-muted-foreground' }
  const { Icon } = meta

  const catColor = category?.color
  const iconBg = catColor ? `${catColor}1f` : undefined
  const iconColor = catColor || undefined

  const txTime = transaction.created_at
    ? new Date(transaction.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 transition-colors duration-150',
        'hover:bg-muted/40',
        selected && 'bg-accent-soft',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-center gap-3 py-3 text-left focus-visible:outline-none"
      >
        <span
          className={cn(
            'inline-flex size-[38px] shrink-0 items-center justify-center rounded-[12px]',
            !catColor && meta.tone,
          )}
          style={catColor ? { backgroundColor: iconBg } : undefined}
          aria-hidden="true"
        >
          <Icon
            className="size-[17px]"
            strokeWidth={1.75}
            style={iconColor ? { color: iconColor } : undefined}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-foreground">{transaction.description}</p>
          <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
            {category ? formatCategoryLabel(category, categories) : TX_TYPE_LABELS[transaction.type]}
            {account && <>{' · '}{account.name}</>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <MoneyDisplay
            amount={parseInt(transaction.amount, 10)}
            type={transaction.type}
            className="text-[14px] font-bold"
          />
          {txTime && (
            <p className="mt-0.5 text-[10.5px] font-medium text-muted-foreground tabular-nums">{txTime}</p>
          )}
        </div>
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
