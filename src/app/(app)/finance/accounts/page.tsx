'use client'

import { useState } from 'react'
import { Plus, ArrowLeftRight, Wallet, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/sections/empty-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { ErrorState } from '@/components/sections/error-state'
import { MoneyDisplay } from '@/components/finance/money-display'
import { Badge } from '@/components/ui/badge'
import { AccountForm } from '@/components/finance/account-form'
import { TransferForm } from '@/components/finance/transfer-form'
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateTransfer,
} from '@/hooks/use-accounts'
import { ACCOUNT_TYPE_LABELS } from '@/domain/constants'
import type { Account, CreateAccountInput, CreateTransferInput } from '@/domain/types'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'
import { MonthPicker } from '@/components/finance/month-picker'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function AccountsPage() {
  const { accounts, isLoading, error, mutate } = useAccounts()
  const { trigger: createAcc, isMutating: creating } = useCreateAccount()
  const { trigger: updateAcc, isMutating: updating } = useUpdateAccount()
  const { trigger: deleteAcc, isMutating: deleting } = useDeleteAccount()
  const { trigger: transfer, isMutating: transferring } = useCreateTransfer()

  const [month, setMonth] = useState(currentYM)
  const [addOpen, setAddOpen] = useState(false)
  const [editAcc, setEditAcc] = useState<Account | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  const grouped = accounts.reduce<Record<string, Account[]>>((acc, a) => {
    (acc[a.type] = acc[a.type] || []).push(a)
    return acc
  }, {})
  const includedAccounts = accounts.filter((a) => a.include_in_saldo !== 'false')
  const totalBalance = includedAccounts.reduce((sum, a) => sum + (parseInt(a.current_balance, 10) || 0), 0)
  const groupedEntries = Object.entries(grouped)

  async function handleCreate(data: CreateAccountInput) {
    const res = await createAcc(data)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Akun ditambahkan')
    setAddOpen(false)
    mutate()
  }

  async function handleUpdate(data: CreateAccountInput) {
    if (!editAcc) return
    const res = await updateAcc({ id: editAcc.id, data })
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Akun diperbarui')
    setEditAcc(null)
    mutate()
  }

  async function handleDelete() {
    if (!editAcc) return
    const res = await deleteAcc(editAcc.id)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Akun dihapus')
    setEditAcc(null)
    mutate()
  }

  async function handleTransfer(data: CreateTransferInput) {
    const res = await transfer(data)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Transfer berhasil')
    setTransferOpen(false)
    mutate()
  }

  return (
    <PageContainer bleed>
      <header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
        <div className="min-w-0">
          <MobileBackButton />
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Akun</h1>
          <p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
            Bank, kas, dompet digital, dan pinjaman keluarga.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Button
            size="icon"
            variant="outline"
            onClick={() => setTransferOpen(true)}
            aria-label="Transfer antar akun"
            disabled={accounts.length < 2}
            className="hidden lg:inline-flex"
          >
            <ArrowLeftRight className="size-4" strokeWidth={2.25} aria-hidden="true" />
          </Button>
          <Button
            variant="accent"
            onClick={() => setAddOpen(true)}
            className="hidden lg:inline-flex"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            Tambah Akun
          </Button>
        </div>
      </header>

      {/* Content */}
      {isLoading && <ListSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={() => mutate()} />}

      {!isLoading && !error && accounts.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="Belum ada akun"
          description="Tambah akun bank, kas, atau dompet digital untuk mulai mencatat."
          action={
            <Button variant="accent" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              Tambah Akun
            </Button>
          }
        />
      )}

      {!isLoading && accounts.length > 0 && (
        <div className="lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
          {/* Total saldo row */}
          <div className="bg-surface px-5 py-4 lg:bg-muted/40 lg:px-6">
            <p className="text-eyebrow text-muted-foreground">Total Saldo</p>
            <MoneyDisplay amount={totalBalance} className="mt-1 text-2xl lg:text-[26px]" />
            {includedAccounts.length < accounts.length && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {accounts.length - includedAccounts.length} akun dikecualikan dari saldo
              </p>
            )}
          </div>

          {groupedEntries.map(([type, items], idx) => (
            <section
              key={type}
              aria-label={ACCOUNT_TYPE_LABELS[type] ?? type}
              className={cn('mb-2 lg:mb-0', 'lg:border-t lg:border-border', idx === 0 && 'lg:border-t')}
            >
              <div className="px-5 pb-1.5 pt-3 lg:bg-muted/40 lg:py-2">
                <p className="text-eyebrow text-muted-foreground">
                  {ACCOUNT_TYPE_LABELS[type] ?? type}
                </p>
              </div>
              <div className="divide-y divide-border bg-surface">
                {items.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setEditAcc(acc)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: acc.color || '#1e40af' }}
                    >
                      {acc.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-medium">{acc.name}</p>
                        {acc.include_in_saldo === 'false' && (
                          <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                            Dikecualikan
                          </Badge>
                        )}
                      </div>
                      {acc.bank_name && (
                        <p className="truncate text-xs text-muted-foreground">{acc.bank_name}</p>
                      )}
                    </div>
                    <MoneyDisplay amount={parseInt(acc.current_balance, 10) || 0} />
                  </button>
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
            <DialogTitle>Tambah Akun</DialogTitle>
          </DialogHeader>
          <AccountForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} loading={creating} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAcc} onOpenChange={(open) => !open && setEditAcc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Akun</DialogTitle>
          </DialogHeader>
          {editAcc && (
            <>
              <AccountForm
                defaultValues={editAcc}
                onSubmit={handleUpdate}
                onCancel={() => setEditAcc(null)}
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
                {deleting ? 'Menghapus…' : 'Hapus Akun'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Antar Akun</DialogTitle>
          </DialogHeader>
          <TransferForm
            onSubmit={handleTransfer}
            onCancel={() => setTransferOpen(false)}
            loading={transferring}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
