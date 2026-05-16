'use client'

import { useState } from 'react'
import { Target, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyInput } from '@/components/finance/money-input'
import { MonthPicker } from '@/components/finance/month-picker'
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/use-budgets'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { formatCategoryLabel, getSelectableCategories } from '@/domain/categories'
import { sumByType, getMonthRange } from '@/domain/transactions'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Budget, CreateBudgetInput } from '@/domain/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const TotalBudgetSchema = z.object({
  allocated_amount: z.number().int().nonnegative('Anggaran tidak boleh negatif'),
})
type TotalBudgetInput = z.infer<typeof TotalBudgetSchema>

const CategoryBudgetSchema = z.object({
  category_id: z.string().min(1, 'Pilih kategori'),
  allocated_amount: z.number().int().nonnegative('Anggaran tidak boleh negatif'),
})
type CategoryBudgetInput = z.infer<typeof CategoryBudgetSchema>

export default function AnggaranPage() {
  const [month, setMonth] = useState(currentYM)
  const [totalDialog, setTotalDialog] = useState(false)
  const [catDialog, setCatDialog] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)

  const { budgets, isLoading, mutate } = useBudgets(month)
  const { trigger: createBudget, isMutating: creating } = useCreateBudget()
  const { trigger: updateBudget, isMutating: updating } = useUpdateBudget()
  const { trigger: deleteBudget, isMutating: deleting } = useDeleteBudget()

  const { categories } = useCategories()
  const expenseCategories = getSelectableCategories(categories, 'expense')

  // Fetch transactions for the selected month
  const [year, mon] = month.split('-').map(Number)
  const { from, to } = getMonthRange(year, mon)
  const { transactions, isLoading: txLoading } = useTransactions({ from, to, limit: 500 })
  const sums = sumByType(transactions)

  // Budget records: empty category_id = total; otherwise per-category
  const totalBudget = budgets.find((b) => b.category_id === '')
  const categoryBudgets = budgets.filter((b) => b.category_id !== '')

  const totalAllocated = totalBudget ? parseInt(totalBudget.allocated_amount, 10) : 0
  const spent = sums.expense
  const remaining = totalAllocated - spent

  // Per-category spending
  const spentByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, number>>((acc, t) => {
      if (t.category_id) acc[t.category_id] = (acc[t.category_id] || 0) + parseInt(t.amount, 10)
      return acc
    }, {})

  // ── handlers ──
  async function handleSaveTotal(data: TotalBudgetInput) {
    const payload: CreateBudgetInput = {
      month,
      category_id: '',
      allocated_amount: data.allocated_amount,
      notes: '',
    }
    const res = await createBudget(payload)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Anggaran total tersimpan')
    setTotalDialog(false)
    mutate()
  }

  async function handleSaveCategory(data: CategoryBudgetInput) {
    const payload: CreateBudgetInput = {
      month,
      category_id: data.category_id,
      allocated_amount: data.allocated_amount,
      notes: '',
    }
    const res = await createBudget(payload)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Anggaran kategori tersimpan')
    setCatDialog(false)
    mutate()
  }

  async function handleUpdateBudget(data: TotalBudgetInput) {
    if (!editBudget) return
    const res = await updateBudget({ id: editBudget.id, data: { allocated_amount: data.allocated_amount } })
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Anggaran diperbarui')
    setEditBudget(null)
    mutate()
  }

  async function handleDeleteBudget(id: string) {
    const res = await deleteBudget(id)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Anggaran dihapus')
    setEditBudget(null)
    mutate()
  }

  const catMap = new Map(categories.map((c) => [c.id, c]))

  // Exclude categories already budgeted
  const budgetedCatIds = new Set(categoryBudgets.map((b) => b.category_id))
  const availableCats = expenseCategories
    .filter((c) => !budgetedCatIds.has(c.id))
    .map((category) => ({
      id: category.id,
      name: formatCategoryLabel(category, categories),
    }))

  return (
    <PageContainer bleed>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-center justify-between px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
          <div>
            <MobileBackButton />
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Anggaran</h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">
              Rencanakan pengeluaran bulanan per kategori.
            </p>
          </div>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3 px-5 lg:px-0">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )}

      {!isLoading && (
        <div className="space-y-4 px-5 lg:px-0">
          {/* Total budget card */}
          {!totalBudget ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface p-8 text-center">
              <Target className="size-8 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <p className="font-semibold">Belum ada anggaran bulan ini</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Atur total anggaran untuk mulai melacak pengeluaran.
                </p>
              </div>
              <Button variant="accent" onClick={() => setTotalDialog(true)}>
                <Plus className="size-4" />
                Atur Anggaran Bulan Ini
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary card */}
              <div className={cn(
                'rounded-xl p-5',
                remaining >= 0 ? 'bg-hero-positive' : 'bg-danger/10',
              )}>
                <div className="flex items-center justify-between">
                  <p className={cn('text-eyebrow', remaining >= 0 ? 'opacity-70' : 'text-danger/80')}>
                    Anggaran {month.replace('-', ' / ')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditBudget(totalBudget)}
                    className="flex size-7 items-center justify-center rounded-md opacity-60 hover:opacity-100"
                    aria-label="Edit anggaran total"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-[11px] font-medium opacity-70">Total Anggaran</p>
                    <p className="mt-0.5 tabular-nums text-[17px] font-bold">{formatMoney(totalAllocated)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium opacity-70">Terpakai</p>
                    <p className="mt-0.5 tabular-nums text-[17px] font-bold">{txLoading ? '...' : formatMoney(spent)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium opacity-70">Sisa</p>
                    <p className={cn(
                      'mt-0.5 tabular-nums text-[17px] font-bold',
                      remaining < 0 ? 'text-danger' : '',
                    )}>
                      {txLoading ? '...' : (remaining < 0 ? '-' : '') + formatMoney(Math.abs(remaining))}
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                {totalAllocated > 0 && (
                  <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          spent / totalAllocated > 0.9 ? 'bg-danger' : 'bg-white',
                        )}
                        style={{ width: `${Math.min((spent / totalAllocated) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] opacity-60">
                      {Math.round((spent / totalAllocated) * 100)}% terpakai
                    </p>
                  </div>
                )}
              </div>

              {/* Per-category budgets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[13px] font-semibold text-muted-foreground">Per Kategori</p>
                  {availableCats.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setCatDialog(true)}>
                      <Plus className="size-3.5" />
                      Tambah
                    </Button>
                  )}
                </div>

                {categoryBudgets.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-surface p-5 text-center text-sm text-muted-foreground">
                    Belum ada anggaran per kategori.{' '}
                    {availableCats.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCatDialog(true)}
                        className="font-semibold text-accent hover:underline"
                      >
                        Tambah sekarang
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border bg-surface">
                    {categoryBudgets.map((budget, idx) => {
                      const cat = catMap.get(budget.category_id)
                      const catSpent = spentByCategory[budget.category_id] || 0
                      const allocated = parseInt(budget.allocated_amount, 10)
                      const catRemaining = allocated - catSpent
                      const pct = allocated > 0 ? Math.min((catSpent / allocated) * 100, 100) : 0
                      const isOver = catSpent > allocated

                      return (
                        <div
                          key={budget.id}
                          className={cn(
                            'px-4 py-3.5',
                            idx > 0 && 'border-t border-border',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">
                                  {cat ? formatCategoryLabel(cat, categories) : budget.category_id}
                                </p>
                                {isOver && (
                                  <span className="shrink-0 rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                                    Melebihi
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    isOver ? 'bg-danger' : pct > 80 ? 'bg-amber-400' : 'bg-success',
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="tabular-nums text-sm font-semibold">
                                {formatMoney(catSpent)}
                              </p>
                              <p className="tabular-nums text-[11px] text-muted-foreground">
                                dari {formatMoney(allocated)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditBudget(budget)}
                              className="shrink-0 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </div>
                          <p className={cn(
                            'mt-1 text-[11px]',
                            isOver ? 'text-danger font-medium' : 'text-muted-foreground',
                          )}>
                            {isOver
                              ? `Melebihi ${formatMoney(Math.abs(catRemaining))}`
                              : `Sisa ${formatMoney(catRemaining)}`}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Setup total budget dialog */}
      <Dialog open={totalDialog} onOpenChange={setTotalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Anggaran Bulan Ini</DialogTitle>
          </DialogHeader>
          <TotalBudgetForm
            onSubmit={handleSaveTotal}
            onCancel={() => setTotalDialog(false)}
            loading={creating}
          />
        </DialogContent>
      </Dialog>

      {/* Add category budget dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggaran Kategori</DialogTitle>
          </DialogHeader>
          <CategoryBudgetForm
            categories={availableCats}
            onSubmit={handleSaveCategory}
            onCancel={() => setCatDialog(false)}
            loading={creating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit budget dialog (total or category) */}
      <Dialog open={!!editBudget} onOpenChange={(open) => !open && setEditBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editBudget?.category_id === ''
                ? 'Edit Anggaran Total'
                : `Edit: ${(() => {
                    const category = catMap.get(editBudget?.category_id ?? '')
                    return category ? formatCategoryLabel(category, categories) : ''
                  })()}`}
            </DialogTitle>
          </DialogHeader>
          {editBudget && (
            <div className="space-y-4">
              <TotalBudgetForm
                defaultAmount={parseInt(editBudget.allocated_amount, 10)}
                onSubmit={handleUpdateBudget}
                onCancel={() => setEditBudget(null)}
                loading={updating}
                submitLabel="Perbarui"
              />
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleDeleteBudget(editBudget.id)}
                disabled={deleting}
              >
                <Trash2 className="size-4" />
                {deleting ? 'Menghapus…' : 'Hapus Anggaran Ini'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

function TotalBudgetForm({
  defaultAmount = 0,
  onSubmit,
  onCancel,
  loading,
  submitLabel = 'Simpan',
}: {
  defaultAmount?: number
  onSubmit: (data: TotalBudgetInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
  submitLabel?: string
}) {
  const { control, handleSubmit, formState: { errors } } = useForm<TotalBudgetInput>({
    resolver: zodResolver(TotalBudgetSchema) as Resolver<TotalBudgetInput>,
    defaultValues: { allocated_amount: defaultAmount },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Total Anggaran</Label>
        <Controller
          name="allocated_amount"
          control={control}
          render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
        />
        {errors.allocated_amount && (
          <p className="text-xs text-danger">{errors.allocated_amount.message}</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Menyimpan...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

function CategoryBudgetForm({
  categories,
  onSubmit,
  onCancel,
  loading,
}: {
  categories: Array<{ id: string; name: string }>
  onSubmit: (data: CategoryBudgetInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}) {
  const { control, handleSubmit, formState: { errors } } = useForm<CategoryBudgetInput>({
    resolver: zodResolver(CategoryBudgetSchema) as Resolver<CategoryBudgetInput>,
    defaultValues: { category_id: '', allocated_amount: 0 },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Kategori</Label>
        <Controller
          name="category_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.category_id && (
          <p className="text-xs text-danger">{errors.category_id.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>Anggaran</Label>
        <Controller
          name="allocated_amount"
          control={control}
          render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
        />
        {errors.allocated_amount && (
          <p className="text-xs text-danger">{errors.allocated_amount.message}</p>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
