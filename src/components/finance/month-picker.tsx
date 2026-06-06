'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthPickerProps {
  value: string // YYYY-MM
  onChange: (month: string) => void
  className?: string
  /** Spread chevrons to the edges with a centered label — for the full-width mobile month bar. */
  fullWidth?: boolean
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

export function MonthPicker({ value, onChange, className, fullWidth = false }: MonthPickerProps) {
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

  const chevron = (
    dir: 'prev' | 'next',
    onClick: () => void,
    label: string,
    Icon: typeof ChevronLeft,
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95',
        fullWidth ? 'size-9' : 'size-7',
      )}
    >
      <Icon className={fullWidth ? 'size-5' : 'size-4'} strokeWidth={2.5} />
    </button>
  )

  return (
    <div
      className={cn(
        'flex items-center',
        fullWidth ? 'w-full justify-between gap-1' : 'gap-1',
        className,
      )}
    >
      {chevron('prev', prev, 'Bulan sebelumnya', ChevronLeft)}
      <button
        type="button"
        onClick={() => !isCurrentMonth && onChange(nowYM)}
        className={cn(
          'rounded-md text-center font-semibold transition-colors',
          fullWidth ? 'flex-1 py-1.5 text-[15px]' : 'min-w-[130px] px-2.5 py-1 text-sm',
          isCurrentMonth ? 'text-foreground' : 'text-accent hover:bg-accent-soft',
        )}
        title={isCurrentMonth ? '' : 'Kembali ke bulan ini'}
      >
        {MONTH_NAMES[month - 1]} {year}
      </button>
      {chevron('next', next, 'Bulan berikutnya', ChevronRight)}
    </div>
  )
}
