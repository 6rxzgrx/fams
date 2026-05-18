'use client'

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { formatMoneyInput, parseMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function MoneyInput({ value, onChange, className, placeholder = '0', disabled }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState(value > 0 ? formatMoneyInput(value) : '')

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^\d]/g, '')
      const num = parseInt(raw, 10) || 0
      setDisplayValue(raw === '' ? '' : formatMoneyInput(num))
      onChange(num)
    },
    [onChange]
  )

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
        Rp
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn('pl-9 tabular-nums', className)}
      />
    </div>
  )
}
