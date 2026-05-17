'use client'

import { useState, useMemo } from 'react'
import { Plus, ArrowLeftRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/sections/empty-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { ErrorState } from '@/components/sections/error-state'
import { TransactionItem } from '@/components/finance/transaction-item'
import { TransactionForm } from '@/components/finance/transaction-form'
import { PeriodPicker, getRangeForPreset } from '@/components/finance/period-picker'
import { TransactionFilterBar } from '@/components/finance/transaction-filter-bar'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useAccounts } from '@/hooks/use-accounts'
import { groupByDate } from '@/domain/transactions'
import type { Transaction, CreateTransactionInput } from '@/domain/types'
import type { PeriodPreset, DateRange } from '@/components/finance/period-picker'
import type { TransactionFilters } from '@/components/finance/transaction-filter-bar'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'

function thisMonthRange(): DateRange {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const pad = (n: number) => String(n).padStart(2, '0')
  const last = new Date(y, m, 0).getDate()
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` }
}

export default function TransactionsPage() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month')
  const [customRange, setCustomRange] = useState<DateRange>(thisMonthRange)
  const [filters, setFilters] = useState<TransactionFilters>({ categoryId: '', date: '', accountId: '' })

  const { from, to } = getRangeForPreset(periodPreset, customRange)

  const { transactions, isLoading, error, mutate } = useTransactions({ from, to, limit: 500 })
  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { trigger: createTx, isMutating: creating } = useCreateTransaction()
  const { trigger: updateTx, isMutating: updating } = useUpdateTransaction()
  const { trigger: deleteTx, isMutating: deleting } = useDeleteTransaction()

  const [addOpen, setAddOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)

  function handlePeriodChange(preset: PeriodPreset, range: DateRange) {
    setPeriodPreset(preset)
    setCustomRange(range)
    // Reset date filter when period changes since dates may no longer exist
    setFilters((f) => ({ ...f, date: '' }))
  }

  // Client-side filtering
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.categoryId && tx.category_id !== filters.categoryId) return false
      if (filters.date && tx.date !== filters.date) return false
      if (filters.accountId && tx.account_id !== filters.accountId) return false
      return true
    })
  }, [transactions, filters])

  // Available dates for the date filter (sorted desc, unique)
  const availableDates = useMemo(() => {
    const dates = [...new Set(transactions.map((tx) => tx.date))].sort((a, b) => b.localeCompare(a))
    return dates
  }, [transactions])

  const grouped = groupByDate(filtered)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  async function handleCreate(data: CreateTransactionInput) {
    const res = await createTx(data)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Tersimpan.')
    setAddOpen(false)
    mutate()
  }

  async function handleUpdate(data: CreateTransactionInput) {
    if (!editTx) return
    const res = await updateTx({ id: editTx.id, data })
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Diperbarui.')
    setEditTx(null)
    mutate()
  }

  async function handleDelete() {
    if (!editTx) return
    const res = await deleteTx(editTx.id)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Dihapus.')
    setEditTx(null)
    mutate()
  }

  const hasActiveFilters = filters.categoryId || filters.date || filters.accountId

  return (
    <PageContainer bleed>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-center justify-between px-5 py-4 lg:px-0 lg:py-0 lg:pb-4">
          <div>
            <MobileBackButton />
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Transaksi</h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">
              Catatan masuk, keluar, dan transfer keluarga.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="accent"
              onClick={() => setAddOpen(true)}
              aria-label="Tambah transaksi"
              size="icon"
              className="rounded-pill lg:hidden"
            >
              <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
            </Button>
            <Button
              variant="accent"
              onClick={() => setAddOpen(true)}
              className="hidden lg:inline-flex"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              Tambah Transaksi
            </Button>
          </div>
        </div>

        {/* Filter bar (sticky inside header) */}
        <div className="space-y-2 border-b border-border px-5 pb-3 lg:px-0">
          <PeriodPicker
            preset={periodPreset}
            customRange={customRange}
            onPresetChange={handlePeriodChange}
          />
          <TransactionFilterBar
            filters={filters}
            onChange={setFilters}
            categories={categories}
            accounts={accounts}
            availableDates={availableDates}
          />
        </div>
      </header>

      {/* Content */}
      {isLoading && <ListSkeleton count={6} />}

      {error && <ErrorState message={error} onRetry={() => mutate()} />}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={ArrowLeftRight}
          title={hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
          description={
            hasActiveFilters
              ? 'Coba ubah filter atau periode yang dipilih.'
              : 'Tambahkan yang pertama dengan tombol di atas.'
          }
          action={
            !hasActiveFilters ? (
              <Button variant="accent" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
                Tambah Transaksi
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && sortedDates.length > 0 && (
        <div className="lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
          {sortedDates.map((date, idx) => (
            <section
              key={date}
              aria-label={format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id })}
              className={cn('mb-2 lg:mb-0', idx > 0 && 'lg:border-t lg:border-border')}
            >
              <div className="px-5 pb-1.5 pt-3 lg:bg-muted/40 lg:py-2">
                <p className="text-eyebrow text-muted-foreground">
                  {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id })}
                </p>
              </div>
              <div className="divide-y divide-border bg-surface">
                {grouped[date].map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    categories={categories}
                    onClick={() => setEditTx(tx)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Transaksi</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleCreate}
            onCancel={() => setAddOpen(false)}
            loading={creating}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          {editTx && (
            <>
              <TransactionForm
                defaultValues={editTx}
                onSubmit={handleUpdate}
                onCancel={() => setEditTx(null)}
                loading={updating}
              />
              <Button
                variant="destructive"
                className="mt-2 w-full"
                onClick={handleDelete}
                disabled={deleting}
                aria-busy={deleting}
              >
                <Trash2 className="size-4" strokeWidth={2.25} aria-hidden="true" />
                {deleting ? 'Menghapus…' : 'Hapus Transaksi'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
