'use client'

import { useState } from 'react'
import { Plus, Briefcase, Wallet, ArrowLeftRight, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/sections/empty-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { ErrorState } from '@/components/sections/error-state'
import { MoneyDisplay } from '@/components/finance/money-display'
import { AccountForm } from '@/components/finance/account-form'
import { AssetForm } from '@/components/finance/asset-form'
import { TransferForm } from '@/components/finance/transfer-form'
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateTransfer,
} from '@/hooks/use-accounts'
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '@/hooks/use-assets'
import { buildRegistryData, type RegistryItem } from '@/components/finance/asset-registry-shared'
import type { Account, Asset, CreateAccountInput, CreateAssetInput, CreateTransferInput } from '@/domain/types'

type EditTarget =
  | { kind: 'account'; item: Account }
  | { kind: 'asset'; item: Asset }

type AddTarget = 'account' | 'asset' | null

interface AssetRegistryManagerProps {
  title?: string
  subtitle?: string
}

export function AssetRegistryManager({
  title = 'Aset & Akun',
  subtitle = 'Kelola akun keuangan dan aset fisik yang dipakai modul keuangan keluarga.',
}: AssetRegistryManagerProps) {
  const { accounts, isLoading: accLoading, error: accError, mutate: mutateAccounts } = useAccounts()
  const { assets, isLoading: assetLoading, error: assetError, mutate: mutateAssets } = useAssets()
  const { trigger: createAcc, isMutating: creatingAcc } = useCreateAccount()
  const { trigger: updateAcc, isMutating: updatingAcc } = useUpdateAccount()
  const { trigger: deleteAcc, isMutating: deletingAcc } = useDeleteAccount()
  const { trigger: transfer, isMutating: transferring } = useCreateTransfer()
  const { trigger: createAsset, isMutating: creatingAsset } = useCreateAsset()
  const { trigger: updateAsset, isMutating: updatingAsset } = useUpdateAsset()
  const { trigger: deleteAsset, isMutating: deletingAsset } = useDeleteAsset()

  const [addTarget, setAddTarget] = useState<AddTarget>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)

  const isLoading = accLoading || assetLoading
  const error = accError || assetError
  const { accountGroups, assetGroups, totalSaldo, totalNilai, hasItems } = buildRegistryData(accounts, assets)

  function mutateAll() {
    mutateAccounts()
    mutateAssets()
  }

  async function handleCreateAccount(data: CreateAccountInput) {
    const res = await createAcc(data)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Akun ditambahkan')
    setAddTarget(null)
    mutateAll()
  }

  async function handleUpdateAccount(data: CreateAccountInput) {
    if (editTarget?.kind !== 'account') return
    const res = await updateAcc({ id: editTarget.item.id, data })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Akun diperbarui')
    setEditTarget(null)
    mutateAll()
  }

  async function handleDeleteAccount() {
    if (editTarget?.kind !== 'account') return
    const res = await deleteAcc(editTarget.item.id)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Akun dihapus')
    setEditTarget(null)
    mutateAll()
  }

  async function handleCreateAsset(data: CreateAssetInput) {
    const res = await createAsset(data)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Aset ditambahkan')
    setAddTarget(null)
    mutateAll()
  }

  async function handleUpdateAsset(data: CreateAssetInput) {
    if (editTarget?.kind !== 'asset') return
    const res = await updateAsset({ id: editTarget.item.id, data })
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Aset diperbarui')
    setEditTarget(null)
    mutateAll()
  }

  async function handleDeleteAsset() {
    if (editTarget?.kind !== 'asset') return
    const res = await deleteAsset(editTarget.item.id)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Aset dihapus')
    setEditTarget(null)
    mutateAll()
  }

  async function handleTransfer(data: CreateTransferInput) {
    const res = await transfer(data)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Transfer berhasil')
    setTransferOpen(false)
    mutateAll()
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight tracking-tight lg:text-[24px]">{title}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setTransferOpen(true)}
            aria-label="Transfer antar akun"
            disabled={accounts.length < 2}
            className="rounded-pill lg:rounded-md"
          >
            <ArrowLeftRight className="size-5 lg:size-4" strokeWidth={2.25} aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="accent" size="icon" className="rounded-pill lg:hidden" aria-label="Tambah">
                <Plus className="size-5" strokeWidth={2.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddTarget('account')}>
                <Wallet className="size-4" />
                Tambah Akun
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddTarget('asset')}>
                <Briefcase className="size-4" />
                Tambah Aset Fisik
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="accent" className="hidden lg:inline-flex">
                <Plus className="size-4" strokeWidth={2.5} />
                Tambah
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddTarget('account')}>
                <Wallet className="size-4" />
                Tambah Akun (Bank/Kas/Dompet)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddTarget('asset')}>
                <Briefcase className="size-4" />
                Tambah Aset Fisik (Properti/Kendaraan/Emas)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {isLoading && <ListSkeleton count={5} />}
      {error && <ErrorState message={error} onRetry={mutateAll} />}

      {!isLoading && !error && !hasItems && (
        <EmptyState
          icon={Briefcase}
          title="Belum ada aset"
          description="Tambah akun bank, kas, atau aset fisik seperti properti dan kendaraan."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddTarget('account')}>
                <Wallet className="size-4" />
                Tambah Akun
              </Button>
              <Button variant="accent" onClick={() => setAddTarget('asset')}>
                <Briefcase className="size-4" />
                Tambah Aset
              </Button>
            </div>
          }
        />
      )}

      {!isLoading && !error && hasItems && (
        <div className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
          <div className="bg-surface px-5 py-4 lg:border-b lg:border-border lg:bg-muted/40 lg:px-6">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-eyebrow text-muted-foreground">Total Saldo</p>
                <MoneyDisplay amount={totalSaldo} className="mt-1 text-2xl lg:text-[26px]" />
                <p className="mt-0.5 text-[11px] text-muted-foreground">Aset yang dihitung ke saldo</p>
              </div>
              {totalNilai !== totalSaldo && (
                <div>
                  <p className="text-eyebrow text-muted-foreground">Total Nilai</p>
                  <MoneyDisplay amount={totalNilai} className="mt-1 text-2xl lg:text-[26px]" />
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Semua aset</p>
                </div>
              )}
            </div>
          </div>

          {Object.keys(accountGroups).length > 0 && (
            <ManagerGroupSection
              title="Akun"
              subTitle="Bank, tunai, dompet digital"
              groups={accountGroups}
              onSelect={(item) => setEditTarget({ kind: 'account', item: item.raw as Account })}
            />
          )}

          {Object.keys(assetGroups).length > 0 && (
            <ManagerGroupSection
              title="Aset Fisik"
              subTitle="Properti, kendaraan, emas, dan lainnya"
              groups={assetGroups}
              onSelect={(item) => setEditTarget({ kind: 'asset', item: item.raw as Asset })}
            />
          )}
        </div>
      )}

      <Dialog open={addTarget === 'account'} onOpenChange={(open) => !open && setAddTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Akun</DialogTitle>
          </DialogHeader>
          <AccountForm onSubmit={handleCreateAccount} onCancel={() => setAddTarget(null)} loading={creatingAcc} />
        </DialogContent>
      </Dialog>

      <Dialog open={addTarget === 'asset'} onOpenChange={(open) => !open && setAddTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Aset Fisik</DialogTitle>
          </DialogHeader>
          <AssetForm onSubmit={handleCreateAsset} onCancel={() => setAddTarget(null)} loading={creatingAsset} />
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget?.kind === 'account'} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Akun</DialogTitle>
          </DialogHeader>
          {editTarget?.kind === 'account' && (
            <>
              <AccountForm
                defaultValues={editTarget.item}
                onSubmit={handleUpdateAccount}
                onCancel={() => setEditTarget(null)}
                loading={updatingAcc}
              />
              <Button
                variant="destructive"
                className="mt-2 w-full"
                onClick={handleDeleteAccount}
                disabled={deletingAcc}
              >
                <Trash2 className="size-4" />
                {deletingAcc ? 'Menghapus...' : 'Hapus Akun'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget?.kind === 'asset'} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Aset</DialogTitle>
          </DialogHeader>
          {editTarget?.kind === 'asset' && (
            <>
              <AssetForm
                defaultValues={editTarget.item}
                onSubmit={handleUpdateAsset}
                onCancel={() => setEditTarget(null)}
                loading={updatingAsset}
              />
              <Button
                variant="destructive"
                className="mt-2 w-full"
                onClick={handleDeleteAsset}
                disabled={deletingAsset}
              >
                <Trash2 className="size-4" />
                {deletingAsset ? 'Menghapus...' : 'Hapus Aset'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

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
    </div>
  )
}

function ManagerGroupSection({
  title,
  subTitle,
  groups,
  onSelect,
}: {
  title: string
  subTitle?: string
  groups: Record<string, RegistryItem[]>
  onSelect: (item: RegistryItem) => void
}) {
  return (
    <div className="lg:border-t lg:border-border">
      <div className="px-5 pb-1.5 pt-3 lg:bg-muted/20 lg:py-2.5">
        <p className="text-sm font-semibold">{title}</p>
        {subTitle && <p className="text-[11px] text-muted-foreground">{subTitle}</p>}
      </div>
      {Object.entries(groups).map(([groupLabel, items], idx) => (
        <section key={groupLabel} className={cn('mb-2 lg:mb-0', idx > 0 && 'lg:border-t lg:border-border/60')}>
          <div className="px-5 pb-1 pt-2 lg:bg-muted/40 lg:py-1.5">
            <p className="text-eyebrow text-muted-foreground">{groupLabel}</p>
          </div>
          <div className="divide-y divide-border bg-surface">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
              >
                <div
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    item.kind === 'account' ? 'text-white' : 'bg-accent-soft text-accent',
                  )}
                  style={item.kind === 'account' ? { backgroundColor: (item.raw as Account).color || '#1e40af' } : undefined}
                >
                  {item.kind === 'account'
                    ? item.name.slice(0, 1).toUpperCase()
                    : <Briefcase className="size-5" strokeWidth={2} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium">{item.name}</p>
                    {!item.includeInSaldo && (
                      <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                        Dikecualikan
                      </Badge>
                    )}
                  </div>
                  {item.subLabel && (
                    <p className="truncate text-xs text-muted-foreground">{item.subLabel}</p>
                  )}
                </div>
                <MoneyDisplay amount={item.value} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
