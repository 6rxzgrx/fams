'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/sections/error-state'
import { MoneyDisplay } from '@/components/finance/money-display'
import { usePriceRates } from '@/hooks/use-price-rates'
import { isRateStale } from '@/domain/rates'
import type { PriceRate } from '@/domain/types'

const ManualRateSchema = z.object({
  symbol: z.string().min(1, 'Symbol wajib diisi').max(50),
  label: z.string().min(1, 'Label wajib diisi').max(100),
  unit: z.string().min(1, 'Satuan wajib diisi').max(50),
  value_idr_per_unit: z
    .string()
    .min(1, 'Nilai wajib diisi')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Nilai tidak valid'),
})

type ManualRateValues = z.infer<typeof ManualRateSchema>

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ApiRateCard({ rate }: { rate: PriceRate }) {
  const stale = isRateStale(rate.updated_at)
  let rawLabel = ''
  try {
    const raw = JSON.parse(rate.raw_api_data || '{}')
    if (raw.xau_usd && raw.usd_idr) {
      rawLabel = `XAU $${raw.xau_usd.toLocaleString('id-ID', { maximumFractionDigits: 2 })} · USD Rp ${Math.round(raw.usd_idr).toLocaleString('id-ID')}`
    }
  } catch {}

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{rate.symbol}</span>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            Otomatis
          </Badge>
          {stale ? (
            <Badge variant="warning" className="flex items-center gap-1 px-1.5 py-0 text-[10px]">
              <Clock className="size-3" />
              Perlu diperbarui
            </Badge>
          ) : (
            <Badge variant="success" className="flex items-center gap-1 px-1.5 py-0 text-[10px]">
              <CheckCircle2 className="size-3" />
              Baru
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{rate.label}</p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <MoneyDisplay
            amount={Math.round(parseFloat(rate.value_idr_per_unit))}
            className="text-base font-semibold"
          />
          <span className="text-xs text-muted-foreground">/ {rate.unit}</span>
        </div>
        {rawLabel && (
          <p className="mt-1 text-[11px] text-muted-foreground">{rawLabel}</p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          Diperbarui: {formatUpdatedAt(rate.updated_at)}
        </p>
      </div>
    </div>
  )
}

function ManualRateRow({
  rate,
  onEdit,
  onDelete,
}: {
  rate: PriceRate
  onEdit: (rate: PriceRate) => void
  onDelete: (rate: PriceRate) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{rate.symbol}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="truncate text-sm">{rate.label}</span>
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <MoneyDisplay
            amount={Math.round(parseFloat(rate.value_idr_per_unit))}
            className="text-sm font-medium"
          />
          <span className="text-xs text-muted-foreground">/ {rate.unit}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onEdit(rate)}
          aria-label={`Edit ${rate.label}`}
        >
          <Pencil className="size-4" strokeWidth={2} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(rate)}
          aria-label={`Hapus ${rate.label}`}
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}

function RateFormDialog({
  open,
  onClose,
  editTarget,
  onSave,
}: {
  open: boolean
  onClose: () => void
  editTarget: PriceRate | null
  onSave: (values: ManualRateValues) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ManualRateValues>({
    resolver: zodResolver(ManualRateSchema),
    values: editTarget
      ? {
          symbol: editTarget.symbol,
          label: editTarget.label,
          unit: editTarget.unit,
          value_idr_per_unit: editTarget.value_idr_per_unit,
        }
      : { symbol: '', label: '', unit: '', value_idr_per_unit: '' },
  })

  async function onValid(values: ManualRateValues) {
    await onSave(values)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) { reset(); onClose() }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editTarget ? 'Edit Rate' : 'Tambah Rate Manual'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Symbol</Label>
            <Input
              placeholder="cth. BBCA, BTC"
              disabled={!!editTarget}
              {...register('symbol')}
              className="font-mono"
            />
            {errors.symbol && <p className="text-xs text-danger">{errors.symbol.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input placeholder="cth. Saham BCA (per lot)" {...register('label')} />
            {errors.label && <p className="text-xs text-danger">{errors.label.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Satuan</Label>
            <Input placeholder="cth. lot, keping, unit" {...register('unit')} />
            {errors.unit && <p className="text-xs text-danger">{errors.unit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nilai (IDR per satuan)</Label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="cth. 87500"
              {...register('value_idr_per_unit')}
            />
            {errors.value_idr_per_unit && (
              <p className="text-xs text-danger">{errors.value_idr_per_unit.message}</p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { reset(); onClose() }}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ConverterPage() {
  const { rates, isLoading, error, createRate, updateRate, deleteRate, forceRefresh } =
    usePriceRates()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PriceRate | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const apiRates = rates.filter((r) => r.source === 'api')
  const manualRates = rates.filter((r) => r.source === 'manual')

  async function handleSave(values: ManualRateValues) {
    try {
      if (editTarget) {
        await updateRate(editTarget.id, {
          label: values.label,
          unit: values.unit,
          value_idr_per_unit: parseFloat(values.value_idr_per_unit),
        })
        toast.success('Rate berhasil diperbarui')
      } else {
        await createRate({
          symbol: values.symbol.toUpperCase(),
          label: values.label,
          unit: values.unit,
          value_idr_per_unit: parseFloat(values.value_idr_per_unit),
        })
        toast.success('Rate berhasil ditambahkan')
      }
      setFormOpen(false)
      setEditTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan rate')
      throw err
    }
  }

  async function handleDelete(rate: PriceRate) {
    setDeletingId(rate.id)
    try {
      await deleteRate(rate.id)
      toast.success(`Rate ${rate.symbol} dihapus`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus rate')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleForceRefresh() {
    try {
      await forceRefresh()
      toast.success('Harga diperbarui')
    } catch {
      toast.error('Gagal memperbarui harga')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Konverter Harga</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Harga otomatis diperbarui setiap jam. Rate manual diisi secara manual untuk saham dan
          aset lainnya.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {/* API rate card */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          {/* Manual rate rows */}
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <ErrorState
          message={error}
          onRetry={handleForceRefresh}
        />
      )}

      {!isLoading && !error && (
        <>
          {/* API Rates */}
          {apiRates.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Harga Otomatis</p>
                  <p className="text-[12px] text-muted-foreground">
                    Diambil dari API eksternal, diperbarui setiap jam.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleForceRefresh}
                >
                  Perbarui
                </Button>
              </div>
              <div className="space-y-2">
                {apiRates.map((r) => (
                  <ApiRateCard key={r.id} rate={r} />
                ))}
              </div>
            </section>
          )}

          {/* Manual Rates */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Rate Manual</p>
                <p className="text-[12px] text-muted-foreground">
                  Saham, kripto, atau aset lain yang diperbarui sendiri.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => { setEditTarget(null); setFormOpen(true) }}
                className="flex items-center gap-1.5"
              >
                <Plus className="size-4" strokeWidth={2.5} />
                Tambah
              </Button>
            </div>

            {manualRates.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface py-8 text-center">
                <p className="text-sm text-muted-foreground">Belum ada rate manual.</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Tambahkan harga per satuan untuk saham atau aset lainnya.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
                {manualRates.map((r) => (
                  <ManualRateRow
                    key={r.id}
                    rate={r}
                    onEdit={(rate) => { setEditTarget(rate); setFormOpen(true) }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <RateFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        editTarget={editTarget}
        onSave={handleSave}
      />
    </div>
  )
}
