'use client'

import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { formatMoney, formatMoneyCompact } from '@/lib/money'
import { cn } from '@/lib/utils'
import { BUDGET_TYPE_LABELS, BUDGET_TYPE_COLORS } from '@/domain/constants'
import type { Budget, Transaction, TransactionCategory, BudgetType } from '@/domain/types'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'

interface Props {
  budgets: Budget[]
  transactions: Transaction[]
  categories: TransactionCategory[]
  month: string
}

export function ReportBudgetSection({ budgets, transactions, categories, month }: Props) {
  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  }, [month])

  const budgetRows = useMemo(() => {
    const spentBy = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.type !== 'expense' || !tx.category_id) continue
      spentBy.set(tx.category_id, (spentBy.get(tx.category_id) ?? 0) + (parseInt(tx.amount, 10) || 0))
    }

    const catSpent = (catId: string) =>
      categories
        .filter((c) => c.id === catId || (c.parent_id === catId && !c.deleted_at))
        .reduce((sum, c) => sum + (spentBy.get(c.id) ?? 0), 0)

    const catBudgets = budgets.filter((b) => !b.deleted_at && !!b.category_id)
    if (catBudgets.length > 0) {
      return catBudgets.map((b) => {
        const cat = categories.find((c) => c.id === b.category_id)
        return {
          id: b.id,
          label: cat?.name ?? 'Kategori',
          icon: cat?.icon ?? 'tag',
          color: cat?.color || '#64748b',
          allocated: parseInt(b.allocated_amount, 10) || 0,
          spent: catSpent(b.category_id!),
        }
      })
    }

    // Fallback: type-level budgets
    return budgets
      .filter((b) => !b.deleted_at && !b.category_id && !!b.budget_type)
      .map((b) => {
        const bt = b.budget_type as BudgetType
        const typeCatIds = categories
          .filter((c) => c.type === 'expense' && !c.parent_id && c.budget_type === bt && !c.deleted_at)
          .map((c) => c.id)
        const spent = typeCatIds.reduce((sum, id) => sum + catSpent(id), 0)
        return {
          id: b.id,
          label: BUDGET_TYPE_LABELS[bt] ?? bt,
          icon: 'tag',
          color: BUDGET_TYPE_COLORS[bt] ?? '#64748b',
          allocated: parseInt(b.allocated_amount, 10) || 0,
          spent,
        }
      })
  }, [budgets, transactions, categories])

  const overallRow = budgets.find(
    (b) => !b.deleted_at && (b.category_id ?? '') === '' && (b.budget_type ?? '') === '',
  )
  const totalBudget = overallRow
    ? parseInt(overallRow.allocated_amount, 10) || 0
    : budgetRows.reduce((s, b) => s + b.allocated, 0)

  const totalSpent = budgetRows.reduce((s, b) => s + b.spent, 0)
  const remaining = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0

  if (totalBudget === 0) return null

  if (budgetRows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 lg:p-6">
        <div className="mb-4">
          <p className="text-eyebrow text-muted-foreground">{monthLabel}</p>
          <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight">Anggaran bulanan</h3>
        </div>
        <div className="flex flex-col items-center py-8 text-center">
          <span className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-muted">
            <FileText className="size-5 text-muted-foreground" strokeWidth={1.75} />
          </span>
          <p className="text-sm font-semibold">Belum ada anggaran per kategori</p>
          <p className="mt-1 max-w-[260px] text-[12.5px] text-muted-foreground">
            Atur anggaran per kategori untuk melihat sisa di sini.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 lg:p-6">
      {/* Header */}
      <div className="mb-4">
        <p className="text-eyebrow text-muted-foreground">{monthLabel}</p>
        <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight">Anggaran bulanan</h3>
      </div>

      {/* Total spent / budget */}
      <div className="flex items-baseline gap-2">
        <p className="text-[22px] font-bold tabular-nums leading-tight tracking-tight lg:text-[26px]">
          {formatMoneyCompact(totalSpent)}
        </p>
        <p className="text-[13px] font-semibold text-muted-foreground tabular-nums">
          / {formatMoneyCompact(totalBudget)}
        </p>
      </div>
      <p className={cn('mt-1 text-[12px] font-semibold', remaining >= 0 ? 'text-success' : 'text-danger')}>
        {remaining >= 0
          ? `Sisa ${formatMoney(remaining)} · ${(100 - pct).toFixed(0)}% anggaran`
          : `Lebih ${formatMoney(-remaining)}`}
      </p>

      {/* Radar chart */}
      <BudgetRadarChart rows={budgetRows} />
    </div>
  )
}

const radarChartConfig = {
  anggaran: { label: 'Anggaran', color: '#60a5fa' },
  terpakai: { label: 'Terpakai', color: '#f97316' },
} satisfies ChartConfig

function BudgetRadarChart({
  rows,
}: {
  rows: { id: string; label: string; allocated: number; spent: number }[]
}) {
  const data = rows.map((r) => ({
    category: r.label.length > 10 ? r.label.slice(0, 9) + '…' : r.label,
    anggaran: r.allocated,
    terpakai: r.spent,
  }))

  return (
    <div className="mt-4 flex gap-3">
      {/* Radar */}
      <ChartContainer config={radarChartConfig} className="h-[240px] w-1/2 min-w-0">
        <RadarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <PolarGrid className="stroke-border" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 10, fontWeight: 600, fill: 'var(--muted-foreground)' }}
          />
          <ChartTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const cat = payload[0]?.payload?.category
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-[12px] shadow-md">
                  <p className="mb-1.5 font-semibold">{cat}</p>
                  {payload.map((p) => (
                    <div key={String(p.dataKey)} className="flex items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="text-muted-foreground">
                        {p.dataKey === 'anggaran' ? 'Anggaran' : 'Terpakai'}:
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatMoneyCompact(p.value as number)}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }}
          />
          <Radar
            dataKey="anggaran"
            stroke={radarChartConfig.anggaran.color}
            fill={radarChartConfig.anggaran.color}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <Radar
            dataKey="terpakai"
            stroke={radarChartConfig.terpakai.color}
            fill={radarChartConfig.terpakai.color}
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>

      {/* Legend */}
      <div className="flex w-1/2 flex-col gap-0.5 self-center overflow-hidden">
        <div className="mb-1.5 flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#60a5fa]" />
            Anggaran
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[#f97316]" />
            Terpakai
          </span>
        </div>
        {rows.map((r) => {
          const sisa = r.allocated - r.spent
          const sisaPct = r.allocated > 0 ? Math.round((sisa / r.allocated) * 100) : 0
          const over = sisa < 0
          return (
            <div key={r.id} className="rounded-md px-2 py-1.5 hover:bg-muted/50">
              <p className="truncate text-[11px] font-semibold leading-tight">{r.label}</p>
              <p className="mt-0.5 tabular-nums text-[10.5px] text-muted-foreground">
                {formatMoneyCompact(r.allocated)}
              </p>
              <p className={cn('tabular-nums text-[10.5px] font-bold', over ? 'text-danger' : 'text-success')}>
                {over ? `+${Math.abs(sisaPct)}% lebih` : `${sisaPct}% sisa`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
