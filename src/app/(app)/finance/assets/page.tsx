'use client'

import { useState } from 'react'
import { Plus, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/sections/empty-state'
import { ListSkeleton } from '@/components/sections/loading-state'
import { ErrorState } from '@/components/sections/error-state'
import { MoneyDisplay } from '@/components/finance/money-display'
import { QuantityDisplay } from '@/components/finance/quantity-display'
import { CategoryIcon } from '@/components/finance/category-icon'
import { AssetForm, type UnifiedAssetResult } from '@/components/finance/asset-form'
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/use-assets'
import { ASSET_TYPE_LABELS, ASSET_TYPE_ICONS, ASSET_TYPE_COLORS, ASSET_TYPE_SATUAN } from '@/domain/constants'
import type { Asset, CreateAssetInput } from '@/domain/types'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'
import { MonthPicker } from '@/components/finance/month-picker'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function AssetsPage() {
  const { assets, isLoading, error, mutate } = useAssets()
  const { trigger: createAsset, isMutating: creating } = useCreateAsset()
  const { trigger: updateAsset, isMutating: updating } = useUpdateAsset()
  const { trigger: deleteAsset, isMutating: deleting } = useDeleteAsset()

  const [month, setMonth] = useState(currentYM)
  const [addOpen, setAddOpen] = useState(false)
  const [editAsset, setEditAsset] = useState<Asset | null>(null)

  const grouped = assets.reduce<Record<string, Asset[]>>((acc, a) => {
    ;(acc[a.type] = acc[a.type] || []).push(a)
    return acc
  }, {})
  const totalValue = assets
    .filter((a) => (a.satuan || ASSET_TYPE_SATUAN[a.type] || 'rupiah') === 'rupiah')
    .reduce((sum, a) => sum + (parseFloat(a.value) || 0), 0)
  const groupedEntries = Object.entries(grouped)

  async function handleCreate(result: UnifiedAssetResult) {
    if (result.kind !== 'asset') return
    const res = await createAsset(result.data as CreateAssetInput)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Aset ditambahkan')
    setAddOpen(false)
    mutate()
  }

  async function handleUpdate(result: UnifiedAssetResult) {
    if (!editAsset || result.kind !== 'asset') return
    const res = await updateAsset({ id: editAsset.id, data: result.data as CreateAssetInput })
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
      <header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
        <div className="min-w-0">
          <MobileBackButton />
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Aset</h1>
          <p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
            Aset non-likuid milik keluarga.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Button variant="accent" onClick={() => setAddOpen(true)} className="hidden lg:inline-flex">
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            Tambah Aset
          </Button>
        </div>
      </header>

      {isLoading && <ListSkeleton count={4} />}
      {error && <ErrorState message={error} onRetry={() => mutate()} />}

      {!isLoading && !error && assets.length === 0 && (
        <EmptyState
          icon={Briefcase}
          title="Belum ada aset"
          description="Catat investasi, logam mulia, saham, atau aset lainnya."
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
          <div className="bg-surface px-5 py-4 lg:bg-muted/40 lg:px-6">
            <p className="text-eyebrow text-muted-foreground">Total Nilai Aset</p>
            <MoneyDisplay amount={totalValue} className="mt-1 text-2xl lg:text-[26px]" />
          </div>

          {groupedEntries.map(([type, items], idx) => (
            <section
              key={type}
              aria-label={ASSET_TYPE_LABELS[type] ?? type}
              className={cn('mb-2 lg:mb-0 lg:border-t lg:border-border', idx === 0 && 'lg:border-t')}
            >
              <div className="px-5 pb-1.5 pt-3 lg:bg-muted/40 lg:py-2">
                <p className="text-eyebrow text-muted-foreground">{ASSET_TYPE_LABELS[type] ?? type}</p>
              </div>
              <div className="divide-y divide-border bg-surface">
                {items.map((asset) => {
                  const icon = asset.icon ?? ASSET_TYPE_ICONS[asset.type] ?? 'briefcase'
                  const color = asset.color ?? ASSET_TYPE_COLORS[asset.type] ?? '#64748b'
                  return (
                    <button
                      key={asset.id}
                      onClick={() => setEditAsset(asset)}
                      className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: color }}
                      >
                        <CategoryIcon icon={icon} className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{asset.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{ASSET_TYPE_LABELS[asset.type] ?? asset.type}</p>
                      </div>
                      <QuantityDisplay value={parseFloat(asset.value) || 0} satuan={asset.satuan || ASSET_TYPE_SATUAN[asset.type] || 'rupiah'} />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Aset</DialogTitle>
          </DialogHeader>
          <AssetForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} loading={creating} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editAsset} onOpenChange={(open) => !open && setEditAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Aset</DialogTitle>
          </DialogHeader>
          {editAsset && (
            <AssetForm
              defaultEdit={{ kind: 'asset', item: editAsset }}
              onSubmit={handleUpdate}
              onCancel={() => setEditAsset(null)}
              onDelete={handleDelete}
              loading={updating}
              deleting={deleting}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
