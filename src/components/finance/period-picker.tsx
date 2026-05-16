'use client'

import { useState } from 'react'
import { CalendarDays, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type PeriodPreset = 'this_month' | 'last_month' | '3_months' | '6_months' | 'custom'

export interface DateRange {
  from: string // YYYY-MM-DD
  to: string   // YYYY-MM-DD
}

interface PeriodPickerProps {
  preset: PeriodPreset
  customRange: DateRange
  onPresetChange: (preset: PeriodPreset, range: DateRange) => void
  className?: string
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function pad(n: number) { return String(n).padStart(2, '0') }

function lastDayOf(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function getRangeForPreset(preset: PeriodPreset, customRange: DateRange): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1

  if (preset === 'this_month') {
    return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDayOf(y, m))}` }
  }
  if (preset === 'last_month') {
    const pm = m === 1 ? 12 : m - 1
    const py = m === 1 ? y - 1 : y
    return { from: `${py}-${pad(pm)}-01`, to: `${py}-${pad(pm)}-${pad(lastDayOf(py, pm))}` }
  }
  if (preset === '3_months') {
    const startM = m - 2 <= 0 ? m - 2 + 12 : m - 2
    const startY = m - 2 <= 0 ? y - 1 : y
    return { from: `${startY}-${pad(startM)}-01`, to: `${y}-${pad(m)}-${pad(lastDayOf(y, m))}` }
  }
  if (preset === '6_months') {
    const startM = m - 5 <= 0 ? m - 5 + 12 : m - 5
    const startY = m - 5 <= 0 ? y - 1 : y
    return { from: `${startY}-${pad(startM)}-01`, to: `${y}-${pad(m)}-${pad(lastDayOf(y, m))}` }
  }
  return customRange
}

function presetLabel(preset: PeriodPreset, customRange: DateRange, range: DateRange): string {
  const now = new Date()
  const m = now.getMonth() + 1
  const y = now.getFullYear()

  if (preset === 'this_month') return `${MONTH_NAMES[m - 1]} ${y}`
  if (preset === 'last_month') {
    const pm = m === 1 ? 12 : m - 1
    const py = m === 1 ? y - 1 : y
    return `${MONTH_NAMES[pm - 1]} ${py}`
  }
  if (preset === '3_months') return '3 Bulan Terakhir'
  if (preset === '6_months') return '6 Bulan Terakhir'
  if (preset === 'custom' && customRange.from && customRange.to) {
    return `${customRange.from} – ${customRange.to}`
  }
  return 'Pilih Periode'
}

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'this_month', label: 'Bulan ini' },
  { value: 'last_month', label: 'Bulan lalu' },
  { value: '3_months', label: '3 Bulan Terakhir' },
  { value: '6_months', label: '6 Bulan Terakhir' },
  { value: 'custom', label: 'Rentang Kustom…' },
]

export function PeriodPicker({ preset, customRange, onPresetChange, className }: PeriodPickerProps) {
  const [customOpen, setCustomOpen] = useState(false)
  const [draftFrom, setDraftFrom] = useState(customRange.from)
  const [draftTo, setDraftTo] = useState(customRange.to)

  const range = getRangeForPreset(preset, customRange)
  const label = presetLabel(preset, customRange, range)

  function handlePreset(p: PeriodPreset) {
    if (p === 'custom') {
      setDraftFrom(customRange.from || range.from)
      setDraftTo(customRange.to || range.to)
      setCustomOpen(true)
      return
    }
    onPresetChange(p, getRangeForPreset(p, customRange))
  }

  function handleCustomApply() {
    if (!draftFrom || !draftTo) return
    const newRange = { from: draftFrom, to: draftTo }
    onPresetChange('custom', newRange)
    setCustomOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted',
              className,
            )}
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            <span>{label}</span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {PRESETS.map((p, i) => (
            <>
              {i === PRESETS.length - 1 && <DropdownMenuSeparator key={`sep-${p.value}`} />}
              <DropdownMenuItem key={p.value} onClick={() => handlePreset(p.value)}>
                <Check
                  className={cn('mr-2 size-4', preset === p.value ? 'opacity-100' : 'opacity-0')}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                {p.label}
              </DropdownMenuItem>
            </>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Rentang Tanggal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Dari</Label>
              <Input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sampai</Label>
              <Input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} min={draftFrom} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCustomOpen(false)}>Batal</Button>
              <Button variant="accent" className="flex-1" onClick={handleCustomApply} disabled={!draftFrom || !draftTo || draftFrom > draftTo}>
                Terapkan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
