'use client'

import { MoneyDisplay } from '@/components/finance/money-display'

interface QuantityDisplayProps {
  value: number
  satuan: string
  idrValue?: number | null
  className?: string
}

export function QuantityDisplay({ value, satuan, idrValue, className }: QuantityDisplayProps) {
  if (satuan === 'rupiah') {
    return <MoneyDisplay amount={value} className={className} />
  }

  const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(value)

  return (
    <div className="text-right">
      <span className={className}>{formatted} {satuan}</span>
      {idrValue != null && (
        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
          ≈ <MoneyDisplay amount={Math.round(idrValue)} className="inline text-[11px]" />
        </p>
      )}
    </div>
  )
}
