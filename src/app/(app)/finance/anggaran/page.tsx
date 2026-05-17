'use client'

import { useState, useEffect, useCallback } from 'react'
import { Target, Settings2, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MoneyInput } from '@/components/finance/money-input'
import { MonthPicker } from '@/components/finance/month-picker'
import { CategoryIcon } from '@/components/finance/category-icon'
import { useBudgets, useCreateBudget, useDeleteBudget } from '@/hooks/use-budgets'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { formatCategoryLabel } from '@/domain/categories'
import { sumByType, getMonthRange, spentForType } from '@/domain/transactions'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import { BUDGET_TYPES, BUDGET_TYPE_LABELS, BUDGET_TYPE_COLORS } from '@/domain/constants'
import type { Budget, BudgetType, TransactionCategory } from '@/domain/types'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function ProgressBar({ pct, color, className }: { pct: number; color?: string; className?: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(pct, 100)), 80)
    return () => clearTimeout(t)
  }, [pct])
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-black/20', className)}>
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, backgroundColor: color ?? 'white', transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </div>
  )
}

function MutedProgressBar({ pct, color, danger }: { pct: number; color: string; danger?: boolean }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(pct, 100)), 120)
    return () => clearTimeout(t)
  }, [pct])
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, backgroundColor: danger ? '#ef4444' : color, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnggaranPage() {
  const [month, setMonth] = useState(currentYM)
  const [setupOpen, setSetupOpen] = useState(false)
  const [expandedTypes, setExpandedTypes] = useState<Set<BudgetType>>(new Set())

  const { budgets, isLoading, mutate } = useBudgets(month)
  const { categories } = useCategories()

  const [year, mon] = month.split('-').map(Number)
  const { from, to } = getMonthRange(year, mon)
  const { transactions, isLoading: txLoading } = useTransactions({ from, to, limit: 500 })
  const sums = sumByType(transactions)

  const totalBudget = budgets.find((b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === '')
  const totalAmount = totalBudget ? parseInt(totalBudget.allocated_amount, 10) : 0
  const spent = sums.expense
  const remaining = totalAmount - spent
  const spentPct = totalAmount > 0 ? (spent / totalAmount) * 100 : 0

  const spentByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      if (t.category_id) acc[t.category_id] = (acc[t.category_id] || 0) + parseInt(t.amount, 10)
      return acc
    }, {})

  function getTypeBudget(bt: BudgetType) {
    return budgets.find((b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === bt)
  }

  function getCatBudgetsForType(bt: BudgetType) {
    return budgets.filter((b) => (b.category_id ?? '') !== '' && (b.budget_type ?? '') === bt)
  }

  function toggleExpand(bt: BudgetType) {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(bt)) next.delete(bt)
      else next.add(bt)
      return next
    })
  }

  return (
    <PageContainer bleed>
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-center justify-between px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
          <div>
            <MobileBackButton />
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Anggaran</h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">Rencana pengeluaran bulanan keluarga.</p>
          </div>
          <div className="flex items-center gap-2">
            <MonthPicker value={month} onChange={setMonth} />
            <Button variant="outline" size="sm" onClick={() => setSetupOpen(true)} className="shrink-0 gap-1.5">
              <Settings2 className="size-3.5" />
              <span className="hidden sm:inline">Atur</span>
            </Button>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-3 px-5 lg:px-0">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4 px-5 lg:px-0">
          {!totalBudget && (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface p-8 text-center">
              <Target className="size-8 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="font-semibold">Belum ada anggaran bulan ini</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Atur total anggaran dan alokasikan per tipe pengeluaran.</p>
              </div>
              <Button variant="accent" onClick={() => setSetupOpen(true)}>
                <Plus className="size-4" />
                Buat Anggaran
              </Button>
            </div>
          )}

          {totalBudget && (
            <div className={cn('rounded-xl p-5', remaining >= 0 ? 'bg-hero-positive' : 'bg-danger/10')}>
              <div className="flex items-center justify-between">
                <p className={cn('text-eyebrow', remaining >= 0 ? 'opacity-70' : 'text-danger/80')}>
                  Anggaran {month.replace('-', ' / ')}
                </p>
                <button
                  type="button"
                  onClick={() => setSetupOpen(true)}
                  className="flex size-7 items-center justify-center rounded-md opacity-60 hover:opacity-100"
                  aria-label="Atur anggaran"
                >
                  <Settings2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] font-medium opacity-70">Total</p>
                  <p className="mt-0.5 tabular-nums text-[17px] font-bold">{formatMoney(totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium opacity-70">Terpakai</p>
                  <p className="mt-0.5 tabular-nums text-[17px] font-bold">{txLoading ? '…' : formatMoney(spent)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium opacity-70">Sisa</p>
                  <p className={cn('mt-0.5 tabular-nums text-[17px] font-bold', remaining < 0 && 'text-danger')}>
                    {txLoading ? '…' : (remaining < 0 ? '-' : '') + formatMoney(Math.abs(remaining))}
                  </p>
                </div>
              </div>
              {totalAmount > 0 && (
                <div className="mt-4">
                  <ProgressBar pct={txLoading ? 0 : spentPct} color={spentPct > 90 ? '#ef4444' : 'white'} />
                  <p className="mt-1.5 text-[11px] opacity-60">{txLoading ? '…' : `${Math.round(spentPct)}% terpakai`}</p>
                </div>
              )}
            </div>
          )}

          {totalBudget && (
            <div className="space-y-2">
              <p className="px-1 text-[13px] font-semibold text-muted-foreground">Tipe Anggaran</p>
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                {BUDGET_TYPES.map((bt, idx) => {
                  const typeBudget = getTypeBudget(bt)
                  const typeAmount = typeBudget ? parseInt(typeBudget.allocated_amount, 10) : 0
                  const typePct = totalAmount > 0 && typeAmount > 0 ? Math.round((typeAmount / totalAmount) * 100) : 0
                  const typeSpent = txLoading ? 0 : spentForType(bt, categories, spentByCategory)
                  const typeRemaining = typeAmount - typeSpent
                  const typeSpentPct = typeAmount > 0 ? (typeSpent / typeAmount) * 100 : 0
                  const isOver = typeAmount > 0 && typeSpent > typeAmount
                  const color = BUDGET_TYPE_COLORS[bt]
                  const isExpanded = expandedTypes.has(bt)
                  const typeCategories = categories.filter((c) => c.type === 'expense' && !c.parent_id && c.budget_type === bt && !c.deleted_at)
                  const catBudgets = getCatBudgetsForType(bt)

                  return (
                    <div key={bt} className={cn(idx > 0 && 'border-t border-border')}>
                      <div className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium">{BUDGET_TYPE_LABELS[bt]}</p>
                                {typePct > 0 && (
                                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                                    {typePct}%
                                  </span>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                {typeAmount > 0
                                  ? <p className="tabular-nums text-sm font-semibold">{formatMoney(typeAmount)}</p>
                                  : <p className="text-[12px] text-muted-foreground">Belum diatur</p>
                                }
                                {typeCategories.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpand(bt)}
                                    className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                                    aria-label={isExpanded ? 'Tutup' : 'Lihat kategori'}
                                  >
                                    {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>
                            {typeAmount > 0 && (
                              <div className="mt-2">
                                <MutedProgressBar pct={typeSpentPct} color={color} danger={isOver} />
                                <div className="mt-1.5 flex justify-between">
                                  <p className="tabular-nums text-[11px] text-muted-foreground">
                                    {txLoading ? '…' : `${formatMoney(typeSpent)} terpakai`}
                                  </p>
                                  <p className={cn('tabular-nums text-[11px] font-medium', isOver ? 'text-danger' : 'text-muted-foreground')}>
                                    {txLoading ? '…' : isOver ? `-${formatMoney(Math.abs(typeRemaining))}` : `${formatMoney(typeRemaining)} sisa`}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && typeCategories.length > 0 && (
                        <div className="border-t border-border bg-muted/30 divide-y divide-border">
                          {typeCategories.map((cat) => {
                            const catBudget = catBudgets.find((b) => b.category_id === cat.id)
                            const catAmount = catBudget ? parseInt(catBudget.allocated_amount, 10) : 0
                            const catSpent = spentByCategory[cat.id] ?? 0
                            const catSpentPct = catAmount > 0 ? (catSpent / catAmount) * 100 : 0
                            const catIsOver = catAmount > 0 && catSpent > catAmount

                            return (
                              <div key={cat.id} className="flex items-center gap-3 px-5 py-3">
                                <span
                                  className="inline-flex size-7 shrink-0 items-center justify-center rounded-full"
                                  style={{ backgroundColor: cat.color ?? '#64748b' }}
                                  aria-hidden="true"
                                >
                                  <CategoryIcon icon={cat.icon ?? 'tag'} className="size-3.5 text-white" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-[13px] font-medium">
                                      {formatCategoryLabel(cat, categories)}
                                    </p>
                                    <div className="flex shrink-0 items-center gap-1 text-right">
                                      <p className={cn('tabular-nums text-[13px] font-semibold', catIsOver && 'text-danger')}>
                                        {formatMoney(catSpent)}
                                      </p>
                                      {catAmount > 0 && (
                                        <p className="tabular-nums text-[11px] text-muted-foreground">
                                          / {formatMoney(catAmount)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {catAmount > 0 && (
                                    <MutedProgressBar pct={txLoading ? 0 : catSpentPct} color={color} danger={catIsOver} />
                                  )}
                                  {catAmount === 0 && catSpent > 0 && (
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">Tanpa alokasi khusus</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AnggaranSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        mode={totalBudget ? 'edit' : 'add'}
        month={month}
        budgets={budgets}
        categories={categories}
        onSaved={() => mutate()}
      />
    </PageContainer>
  )
}

// ── TypePctCard ───────────────────────────────────────────────────────────────
function TypePctCard({
  bt,
  pct,
  totalAmount,
  onChange,
}: {
  bt: BudgetType
  pct: number
  totalAmount: number
  onChange: (pct: number) => void
}) {
  const color = BUDGET_TYPE_COLORS[bt]
  const idr = Math.round(totalAmount * pct / 100)

  return (
    <div className="rounded-xl border border-border bg-surface p-4" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <p className="font-medium text-[14px] truncate">{BUDGET_TYPE_LABELS[bt]}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            type="number"
            min={0}
            max={100}
            value={pct === 0 ? '' : pct}
            placeholder="0"
            onChange={(e) => {
              const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0))
              onChange(v)
            }}
            className="w-16 h-11 rounded-lg border border-border bg-background px-2 text-right text-sm tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm font-medium text-muted-foreground">%</span>
        </div>
      </div>
      {totalAmount > 0 && (
        <>
          <p className="mt-2 tabular-nums text-[12px] text-muted-foreground">= {formatMoney(idr)}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
            />
          </div>
        </>
      )}
    </div>
  )
}

// ── AllocationBanner ──────────────────────────────────────────────────────────
function AllocationBanner({ totalTypePct, totalAmount }: { totalTypePct: number; totalAmount: number }) {
  if (totalAmount === 0) return null
  const isExact = totalTypePct === 100
  const isOver = totalTypePct > 100
  return (
    <div
      className={cn(
        'rounded-xl px-4 py-3 text-[13px] font-medium',
        isExact
          ? 'bg-success/10 text-success'
          : isOver
          ? 'bg-danger/10 text-danger'
          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      )}
    >
      {isExact && '✓ Setup terbaik! Total 100%'}
      {!isExact && !isOver && `${totalTypePct}% dari 100% — sisa ${100 - totalTypePct}%`}
      {isOver && `Melebihi 100% sebesar ${totalTypePct - 100}%`}
    </div>
  )
}

// ── CatPctRow ─────────────────────────────────────────────────────────────────
function CatPctRow({
  cat,
  allCategories,
  pct,
  typeAmount,
  color,
  onChange,
}: {
  cat: TransactionCategory
  allCategories: TransactionCategory[]
  pct: number
  typeAmount: number
  color: string
  onChange: (pct: number) => void
}) {
  const idr = Math.round(typeAmount * pct / 100)
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{formatCategoryLabel(cat, allCategories)}</p>
        {typeAmount > 0 && pct > 0 && (
          <p className="tabular-nums text-[11px] text-muted-foreground">= {formatMoney(idr)}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={0}
          max={100}
          value={pct === 0 ? '' : pct}
          placeholder="0"
          onChange={(e) => {
            const v = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0))
            onChange(v)
          }}
          className="w-14 h-10 rounded-lg border border-border bg-background px-2 text-right text-sm tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-[13px] text-muted-foreground">%</span>
      </div>
    </div>
  )
}

// ── CategoryAccordion (shared between add step 3 and edit mode) ───────────────
function CategoryAccordion({
  categories,
  typePcts,
  totalAmount,
  catPcts,
  setCatPcts,
  expandedCatTypes,
  setExpandedCatTypes,
}: {
  categories: TransactionCategory[]
  typePcts: Record<BudgetType, number>
  totalAmount: number
  catPcts: Record<string, number>
  setCatPcts: React.Dispatch<React.SetStateAction<Record<string, number>>>
  expandedCatTypes: Set<BudgetType>
  setExpandedCatTypes: React.Dispatch<React.SetStateAction<Set<BudgetType>>>
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
      {BUDGET_TYPES.map((bt) => {
        const tAmount = Math.round(totalAmount * (typePcts[bt] ?? 0) / 100)
        const typeCats = categories.filter(
          (c) => c.type === 'expense' && !c.parent_id && c.budget_type === bt && !c.deleted_at,
        )
        const catTotalPct = typeCats.reduce((s, c) => s + (catPcts[`${bt}__${c.id}`] ?? 0), 0)
        const color = BUDGET_TYPE_COLORS[bt]
        const isExpanded = expandedCatTypes.has(bt)
        const isSkipped = tAmount === 0
        const isOver = catTotalPct > 100
        const isExact = catTotalPct === 100

        return (
          <div key={bt}>
            <button
              type="button"
              onClick={() => {
                if (isSkipped) return
                setExpandedCatTypes((prev) => {
                  const next = new Set(prev)
                  if (next.has(bt)) next.delete(bt)
                  else next.add(bt)
                  return next
                })
              }}
              disabled={isSkipped}
              className={cn('flex w-full items-center gap-3 px-4 py-3.5 text-left', isSkipped && 'opacity-50')}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[14px]">{BUDGET_TYPE_LABELS[bt]}</p>
                  {isSkipped && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">dilewati</span>
                  )}
                  {!isSkipped && catTotalPct > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                        isExact
                          ? 'bg-success/10 text-success'
                          : isOver
                          ? 'bg-danger/10 text-danger'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                      )}
                    >
                      {catTotalPct}%
                    </span>
                  )}
                </div>
                <p className="tabular-nums text-[12px] text-muted-foreground">{formatMoney(tAmount)}</p>
              </div>
              {!isSkipped && (
                isExpanded
                  ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {isExpanded && !isSkipped && (
              <div className="border-t border-border bg-muted/30 px-4 divide-y divide-border">
                {typeCats.length === 0 ? (
                  <p className="py-3 text-[12px] text-muted-foreground">
                    Belum ada kategori untuk {BUDGET_TYPE_LABELS[bt]}.
                  </p>
                ) : (
                  typeCats.map((cat) => (
                    <CatPctRow
                      key={cat.id}
                      cat={cat}
                      allCategories={categories}
                      pct={catPcts[`${bt}__${cat.id}`] ?? 0}
                      typeAmount={tAmount}
                      color={color}
                      onChange={(v) => setCatPcts((p) => ({ ...p, [`${bt}__${cat.id}`]: v }))}
                    />
                  ))
                )}
                {typeCats.length > 0 && (
                  <div
                    className={cn(
                      'py-2.5 text-[12px] font-medium',
                      isExact ? 'text-success' : isOver ? 'text-danger' : 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {isExact ? '✓ 100%' : `${catTotalPct}% dari 100%`}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Setup Modal ───────────────────────────────────────────────────────────────
function AnggaranSetupModal({
  open,
  onClose,
  mode,
  month,
  budgets,
  categories,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  mode: 'add' | 'edit'
  month: string
  budgets: Budget[]
  categories: TransactionCategory[]
  onSaved: () => void
}) {
  const { trigger: createBudget, isMutating: saving } = useCreateBudget()
  const { trigger: deleteBudget } = useDeleteBudget()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [totalAmount, setTotalAmount] = useState(0)
  const [typePcts, setTypePcts] = useState<Record<BudgetType, number>>({ needs: 0, savings: 0, wants: 0, sedekah: 0 })
  const [catPcts, setCatPcts] = useState<Record<string, number>>({})
  const [perCategory, setPerCategory] = useState(false)
  const [expandedCatTypes, setExpandedCatTypes] = useState<Set<BudgetType>>(new Set())

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    if (mode === 'add') setStep(1)
    setExpandedCatTypes(new Set())

    const tb = budgets.find((b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === '')
    const total = tb ? parseInt(tb.allocated_amount, 10) : 0
    setTotalAmount(total)

    const pcts: Record<BudgetType, number> = { needs: 0, savings: 0, wants: 0, sedekah: 0 }
    const cats: Record<string, number> = {}
    let hasCatBudgets = false

    for (const bt of BUDGET_TYPES) {
      const typeBudget = budgets.find((b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === bt)
      if (typeBudget && total > 0) {
        const stored = parseInt(typeBudget.allocated_amount, 10)
        pcts[bt] = Math.round((stored / total) * 100)
      }
      const catBudgets = budgets.filter((b) => (b.category_id ?? '') !== '' && (b.budget_type ?? '') === bt)
      for (const cb of catBudgets) {
        const typeAmt = Math.round(total * (pcts[bt] ?? 0) / 100)
        const cbAmt = parseInt(cb.allocated_amount, 10)
        cats[`${bt}__${cb.category_id}`] = typeAmt > 0 ? Math.round((cbAmt / typeAmt) * 100) : 0
        hasCatBudgets = true
      }
    }

    setTypePcts(pcts)
    setCatPcts(cats)
    setPerCategory(hasCatBudgets)
  }, [open, budgets, mode])

  // ── Derived ───────────────────────────────────────────────────────────────
  const totalTypePct = BUDGET_TYPES.reduce((s, bt) => s + (typePcts[bt] ?? 0), 0)

  function applyTemplate() {
    setTypePcts({ needs: 70, wants: 20, savings: 10, sedekah: 0 })
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (skipCategories = false) => {
      try {
        const r0 = await createBudget({ month, category_id: '', budget_type: '', allocated_amount: totalAmount, notes: '' })
        if (!r0.ok) { toast.error(r0.error); return }

        for (const bt of BUDGET_TYPES) {
          const tAmt = Math.round(totalAmount * (typePcts[bt] ?? 0) / 100)
          const r = await createBudget({ month, category_id: '', budget_type: bt, allocated_amount: tAmt, notes: '' })
          if (!r.ok) { toast.error(r.error); return }
        }

        if (perCategory && !skipCategories) {
          for (const [key, pct] of Object.entries(catPcts)) {
            if (pct <= 0) continue
            const sep = key.indexOf('__')
            if (sep < 0) continue
            const bt = key.slice(0, sep) as BudgetType
            const catId = key.slice(sep + 2)
            const tAmt = Math.round(totalAmount * (typePcts[bt] ?? 0) / 100)
            const cAmt = Math.round(tAmt * pct / 100)
            const r = await createBudget({ month, category_id: catId, budget_type: bt, allocated_amount: cAmt, notes: '' })
            if (!r.ok) { toast.error(r.error); return }
          }
        } else {
          const toDelete = budgets.filter((b) => (b.category_id ?? '') !== '').map((b) => b.id)
          for (const id of toDelete) await deleteBudget(id)
        }

        toast.success('Anggaran tersimpan')
        onSaved()
        onClose()
      } catch {
        toast.error('Gagal menyimpan anggaran')
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [month, totalAmount, typePcts, catPcts, perCategory, budgets, createBudget, deleteBudget, onSaved, onClose],
  )

  const title = `Atur Anggaran — ${month.replace('-', ' / ')}`

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[560px] max-h-[92dvh] sm:max-h-[85dvh] overflow-hidden">

        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-5 pt-5 pb-4 mb-0">
          <DialogTitle>{title}</DialogTitle>
          {mode === 'add' && (
            <div className="flex items-center gap-2 pt-1">
              {([1, 2, 3] as const).map((s) => (
                <span
                  key={s}
                  className={cn(
                    'size-2 rounded-full transition-colors duration-300',
                    step === s ? 'bg-primary' : step > s ? 'bg-primary/40' : 'bg-muted-foreground/30',
                  )}
                />
              ))}
              <span className="ml-1 text-[12px] text-muted-foreground">Langkah {step} dari 3</span>
            </div>
          )}
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Add mode ── */}
          {mode === 'add' && step === 1 && (
            <div className="flex flex-col gap-4 px-5 py-6">
              <p className="text-[13px] text-muted-foreground">Berapa total pemasukan bulan ini?</p>
              <MoneyInput value={totalAmount} onChange={(v) => setTotalAmount(v ?? 0)} />
              <p className="text-[12px] text-muted-foreground">Masukkan total pendapatan yang ingin dianggarkan.</p>
            </div>
          )}

          {mode === 'add' && step === 2 && (
            <div className="flex flex-col gap-3 px-5 py-4">
              <p className="text-[13px] text-muted-foreground">Bagi ke tipe pengeluaran (total harus 100%)</p>
              <button
                type="button"
                onClick={applyTemplate}
                className="self-start rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="70% Kebutuhan / 20% Keinginan / 10% Tabungan"
              >
                70/20/10
              </button>
              {BUDGET_TYPES.map((bt) => (
                <TypePctCard
                  key={bt}
                  bt={bt}
                  pct={typePcts[bt] ?? 0}
                  totalAmount={totalAmount}
                  onChange={(v) => setTypePcts((p) => ({ ...p, [bt]: v }))}
                />
              ))}
              <AllocationBanner totalTypePct={totalTypePct} totalAmount={totalAmount} />
            </div>
          )}

          {mode === 'add' && step === 3 && (
            <div className="flex flex-col gap-0 py-2">
              <p className="px-5 pb-3 text-[13px] text-muted-foreground">
                Atur alokasi per kategori induk (opsional). Lewati jika tidak perlu detail ini.
              </p>
              <CategoryAccordion
                categories={categories}
                typePcts={typePcts}
                totalAmount={totalAmount}
                catPcts={catPcts}
                setCatPcts={setCatPcts}
                expandedCatTypes={expandedCatTypes}
                setExpandedCatTypes={setExpandedCatTypes}
              />
            </div>
          )}

          {/* ── Edit mode ── */}
          {mode === 'edit' && (
            <div className="flex flex-col gap-6 px-5 py-5">
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Total Anggaran</p>
                <MoneyInput value={totalAmount} onChange={(v) => setTotalAmount(v ?? 0)} />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Alokasi Tipe</p>
                  <button
                    type="button"
                    onClick={applyTemplate}
                    className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    title="70% Kebutuhan / 20% Keinginan / 10% Tabungan"
                  >
                    70/20/10
                  </button>
                </div>
                {BUDGET_TYPES.map((bt) => (
                  <TypePctCard
                    key={bt}
                    bt={bt}
                    pct={typePcts[bt] ?? 0}
                    totalAmount={totalAmount}
                    onChange={(v) => setTypePcts((p) => ({ ...p, [bt]: v }))}
                  />
                ))}
                <AllocationBanner totalTypePct={totalTypePct} totalAmount={totalAmount} />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Alokasi Kategori</p>
                  <div className="flex items-center gap-1.5">
                    <Switch id="edit-per-cat" checked={perCategory} onCheckedChange={setPerCategory} />
                    <Label htmlFor="edit-per-cat" className="cursor-pointer text-[12px] text-muted-foreground">
                      Per Kategori
                    </Label>
                  </div>
                </div>
                {perCategory && (
                  <CategoryAccordion
                    categories={categories}
                    typePcts={typePcts}
                    totalAmount={totalAmount}
                    catPcts={catPcts}
                    setCatPcts={setCatPcts}
                    expandedCatTypes={expandedCatTypes}
                    setExpandedCatTypes={setExpandedCatTypes}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4">
          {mode === 'add' && (
            <div className="flex items-center gap-3">
              {step > 1 ? (
                <Button variant="outline" size="sm" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                  ← Kembali
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
              )}
              <div className="flex-1" />
              {step < 3 && (
                <Button
                  onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                  disabled={step === 1 ? totalAmount === 0 : totalTypePct === 0}
                >
                  Lanjut →
                </Button>
              )}
              {step === 3 && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleSave(true)} disabled={saving}>
                    Lewati
                  </Button>
                  <Button onClick={() => handleSave(false)} disabled={saving || totalAmount === 0}>
                    {saving ? 'Menyimpan…' : 'Simpan ✓'}
                  </Button>
                </>
              )}
            </div>
          )}
          {mode === 'edit' && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onClose}>Batal</Button>
              <div className="flex-1 text-center">
                <p className="tabular-nums text-sm font-semibold">{totalTypePct}% dialokasikan</p>
              </div>
              <Button onClick={() => handleSave(false)} disabled={saving || totalAmount === 0}>
                {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}
