'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  value: string // YYYY-MM
  onChange: (month: string) => void
  className?: string
}

function parseYM(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

function formatYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const { year, month } = parseYM(value)

  const nowYM = formatYM(new Date().getFullYear(), new Date().getMonth() + 1)
  const isCurrentMonth = value === nowYM

  function prev() {
    if (month === 1) onChange(formatYM(year - 1, 12))
    else onChange(formatYM(year, month - 1))
  }

  function next() {
    if (month === 12) onChange(formatYM(year + 1, 1))
    else onChange(formatYM(year, month + 1))
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={prev}
        aria-label="Bulan sebelumnya"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronLeft className="size-4" strokeWidth={2.5} />
      </button>
      <button
        type="button"
        onClick={() => !isCurrentMonth && onChange(nowYM)}
        className={cn(
          'min-w-[130px] rounded-md px-2.5 py-1 text-center text-sm font-semibold transition-colors',
          isCurrentMonth
            ? 'text-foreground'
            : 'text-accent hover:bg-accent-soft',
        )}
        title={isCurrentMonth ? '' : 'Kembali ke bulan ini'}
      >
        {MONTH_NAMES[month - 1]} {year}
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Bulan berikutnya"
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}
