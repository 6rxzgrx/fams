'use client'

import { MoneyDisplay } from '@/components/finance/money-display'

interface QuantityDisplayProps {
  value: number
  satuan: string
  className?: string
}

export function QuantityDisplay({ value, satuan, className }: QuantityDisplayProps) {
  if (satuan === 'rupiah') {
    return <MoneyDisplay amount={value} className={className} />
  }
  const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }).format(value)
  return <span className={className}>{formatted} {satuan}</span>
}
