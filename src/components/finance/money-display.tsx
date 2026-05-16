import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/money'

type TxType = 'income' | 'expense' | 'transfer' | 'adjustment' | 'refund'

interface MoneyDisplayProps {
  amount: number
  type?: TxType
  className?: string
  compact?: boolean
  /** Show +/- prefix even on neutral. Default: only when type signals direction. */
  showSign?: boolean
}

export function MoneyDisplay({ amount, type, className, compact, showSign }: MoneyDisplayProps) {
  const isIncome = type === 'income' || type === 'refund'
  const isExpense = type === 'expense'

  const formatted = compact
    ? `Rp ${new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)}`
    : formatMoney(amount)

  const prefix = isIncome ? '+' : isExpense ? '−' : showSign ? '' : ''

  return (
    <span
      data-money
      className={cn(
        'tabular-nums font-semibold tracking-tight',
        isIncome && 'text-success',
        isExpense && 'text-foreground',
        !isIncome && !isExpense && 'text-foreground',
        className,
      )}
    >
      {prefix}{formatted}
    </span>
  )
}
