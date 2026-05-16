'use client'

import { useState } from 'react'
import { Plus, Briefcase, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/sections/empty-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { ErrorState } from '@/components/sections/error-state'
import { MoneyDisplay } from '@/components/finance/money-display'
import { AssetForm } from '@/components/finance/asset-form'
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '@/hooks/use-assets'
import { useAccounts } from '@/hooks/use-accounts'
import { ASSET_TYPE_LABELS } from '@/domain/constants'
import type { Asset, CreateAssetInput } from '@/domain/types'
import { PageContainer } from '@/components/layout/page-container'

export default function AssetsPage() {
  const { assets, isLoading, error, mutate } = useAssets()
  const { accounts } = useAccounts()
  const { trigger: createAsset, isMutating: creating } = useCreateAsset()
  const { trigger: updateAsset, isMutating: updating } = useUpdateAsset()
  const { trigger: deleteAsset, isMutating: deleting } = useDeleteAsset()

  const [addOpen, setAddOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)

  const grouped = assets.reduce<Record<string, Asset[]>>((acc, a) => {
    (acc[a.type] = acc[a.type] || []).push(a)
    return acc
  }, {})
  const totalValue = assets.reduce((sum, a) => sum + (parseInt(a.value, 10) || 0), 0)
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]))
  const groupedEntries = Object.entries(grouped)

  async function handleCreate(data: CreateAssetInput) {
    const res = await createAsset(data)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Aset ditambahkan')
    setAddOpen(false)
    mutate()
  }

  async function handleUpdate(data: CreateAssetInput) {
    if (!editAsset) return
    const res = await updateAsset({ id: editAsset.id, data })
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Aset diperbarui')
    setEditAsset(null)
    mutate()
  }

  async function handleDelete() {
    if (!editAsset) return
    const res = await deleteAsset(editAsset.id)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Aset dihapus')
    setEditAsset(null)
    mutate()
  }

  return (
    <PageContainer bleed>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-center justify-between px-5 py-4 lg:px-0 lg:py-0 lg:pb-8">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Aset</h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">
              Properti, kendaraan, emas, dan aset lain milik keluarga.
            </p>
          </div>
          <Button
            variant="accent"
            size="icon"
            onClick={() => setAddOpen(true)}
            aria-label="Tambah aset"
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
            Tambah Aset
          </Button>
        </div>
      </header>

      {/* Content */}
      {isLoading && <ListSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={() => mutate()} />}

      {!isLoading && !error && assets.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="Belum ada aset"
          description="Catat properti, kendaraan, emas, atau aset lainnya milik keluarga."
          action={
            <Button variant="accent" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
              Tambah Aset
            </Button>
          }
        />
      )}

      {!isLoading && assets.length > 0 && (
        <div className="lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
          {/* Total nilai row */}
          <div className="bg-surface px-5 py-4 lg:bg-muted/40 lg:px-6">
            <p className="text-eyebrow text-muted-foreground">Total Nilai Aset</p>
            <MoneyDisplay amount={totalValue} className="mt-1 text-2xl lg:text-[26px]" />
          </div>

          {groupedEntries.map(([type, items], idx) => (
            <section
              key={type}
              aria-label={ASSET_TYPE_LABELS[type] ?? type}
              className={cn('mb-2 lg:mb-0', 'lg:border-t lg:border-border', idx === 0 && 'lg:border-t')}
            >
              <div className="px-5 pb-1.5 pt-3 lg:bg-muted/40 lg:py-2">
                <p className="text-eyebrow text-muted-foreground">
                  {ASSET_TYPE_LABELS[type] ?? type}
                </p>
              </div>
              <div className="divide-y divide-border bg-surface">
                {items.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setEditAsset(asset)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent">
                      <Briefcase className="size-5" strokeWidth={2} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{asset.name}</p>
                      {asset.account_id && accountMap.get(asset.account_id) && (
                        <p className="truncate text-xs text-muted-foreground">
                          Akun: {accountMap.get(asset.account_id)}
                        </p>
                      )}
                    </div>
                    <MoneyDisplay amount={parseInt(asset.value, 10) || 0} />
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
            <DialogTitle>Tambah Aset</DialogTitle>
          </DialogHeader>
          <AssetForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} loading={creating} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAsset} onOpenChange={(open) => !open && setEditAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Aset</DialogTitle>
          </DialogHeader>
          {editAsset && (
            <>
              <AssetForm
                defaultValues={editAsset}
                onSubmit={handleUpdate}
                onCancel={() => setEditAsset(null)}
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
                {deleting ? 'Menghapus…' : 'Hapus Aset'}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
