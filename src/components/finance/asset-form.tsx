'use client'

import { useState } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ChevronRight } from 'lucide-react'
import {
  LIQUID_ACCOUNT_TYPES,
  NON_LIQUID_ASSET_TYPES,
  ACCOUNT_TYPE_LABELS,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_ICONS,
  ASSET_TYPE_COLORS,
  ASSET_TYPE_SATUAN,
  SATUAN_OPTIONS,
  CATEGORY_ICON_OPTIONS,
  CATEGORY_COLOR_OPTIONS,
} from '@/domain/constants'
import { CategoryIcon } from '@/components/finance/category-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MoneyInput } from '@/components/finance/money-input'
import { usePriceRates } from '@/hooks/use-price-rates'
import { cn } from '@/lib/utils'
import type { Asset, CreateAssetInput } from '@/domain/types'

// ─── Types ───────────────────────────────────────────────────────────────────

type LiquidType = typeof LIQUID_ACCOUNT_TYPES[number]
type NonLiquidType = typeof NON_LIQUID_ASSET_TYPES[number]
type AssetCategory = LiquidType | NonLiquidType

function isLiquid(cat: AssetCategory): cat is LiquidType {
  return (LIQUID_ACCOUNT_TYPES as readonly string[]).includes(cat)
}

const UnifiedSchema = z.object({
  icon: z.string().default('briefcase'),
  color: z.string().default('#64748b'),
  name: z.string().min(1, 'Nama wajib diisi').max(100),
  balance: z.number().nonnegative('Jumlah tidak boleh negatif'),
  satuan: z.string().default('rupiah'),
  category: z.string().min(1, 'Pilih tipe aset'),
  include_in_saldo: z.boolean().default(true),
  notes: z.string().max(500).default(''),
  price_symbol: z.string().default(''),
})

type UnifiedValues = z.infer<typeof UnifiedSchema>

export type UnifiedAssetResult = { kind: 'account' | 'asset'; data: CreateAssetInput }

// ─── Default values from existing record ─────────────────────────────────────

type EditTarget = { kind: 'account' | 'asset'; item: Partial<Asset> }

function toUnifiedDefaults(edit?: EditTarget): Partial<UnifiedValues> {
  if (!edit) return { icon: 'briefcase', color: '#64748b', balance: 0, satuan: 'rupiah', include_in_saldo: true }
  const a = edit.item
  const isLiquidEdit = edit.kind === 'account'
  return {
    icon: a.icon ?? 'briefcase',
    color: a.color ?? (isLiquidEdit ? '#1e40af' : '#64748b'),
    name: a.name ?? '',
    balance: a.current_balance ? parseFloat(a.current_balance) : 0,
    satuan: isLiquidEdit ? 'rupiah' : (a.satuan || ASSET_TYPE_SATUAN[a.type ?? ''] || 'rupiah'),
    category: a.type ?? '',
    include_in_saldo: isLiquidEdit ? a.include_in_saldo !== 'false' : a.include_in_saldo === 'true',
    notes: a.notes ?? '',
    price_symbol: a.price_symbol ?? '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AssetFormProps {
  defaultEdit?: EditTarget
  onSubmit: (result: UnifiedAssetResult) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
  loading?: boolean
  deleting?: boolean
}

export function AssetForm({
  defaultEdit,
  onSubmit,
  onCancel,
  onDelete,
  loading,
  deleting,
}: AssetFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [typePickerOpen, setTypePickerOpen] = useState(false)

  const defaults = toUnifiedDefaults(defaultEdit)
  const isEditing = !!defaultEdit

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UnifiedValues>({
    resolver: zodResolver(UnifiedSchema) as Resolver<UnifiedValues>,
    defaultValues: {
      icon: defaults.icon ?? 'briefcase',
      color: defaults.color ?? '#64748b',
      name: defaults.name ?? '',
      balance: defaults.balance ?? 0,
      satuan: defaults.satuan ?? 'rupiah',
      category: defaults.category ?? '',
      include_in_saldo: defaults.include_in_saldo ?? true,
      notes: defaults.notes ?? '',
      price_symbol: defaults.price_symbol ?? '',
    },
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const selectedCategory = watch('category') as AssetCategory | ''
  const selectedSatuan = watch('satuan')
  const includeInSaldo = watch('include_in_saldo')
  const isRupiah = selectedSatuan === 'rupiah'

  const { rates } = usePriceRates()

  const categoryLabel = selectedCategory
    ? (ACCOUNT_TYPE_LABELS[selectedCategory] ?? ASSET_TYPE_LABELS[selectedCategory] ?? selectedCategory)
    : 'Pilih tipe aset'

  async function onValid(values: UnifiedValues) {
    const cat = values.category as AssetCategory
    const liquid = isLiquid(cat)
    await onSubmit({
      kind: liquid ? 'account' : 'asset',
      data: {
        kind: liquid ? 'liquid' : 'non_liquid',
        name: values.name,
        type: cat,
        current_balance: values.balance,
        satuan: liquid ? 'rupiah' : values.satuan,
        price_symbol: liquid || values.satuan === 'rupiah' ? '' : values.price_symbol,
        icon: values.icon,
        color: values.color,
        include_in_saldo: values.include_in_saldo,
        notes: values.notes,
        currency: 'IDR',
        bank_name: '',
        account_number: '',
      },
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit(onValid)} className="space-y-4">

        {/* Row 1: icon+color | nama aset */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl ring-2 ring-transparent transition-all hover:ring-border focus:outline-none focus:ring-border"
            style={{ backgroundColor: selectedColor }}
            aria-label="Pilih ikon dan warna"
          >
            <CategoryIcon icon={selectedIcon} className="size-5 text-white drop-shadow-sm" />
          </button>
          <div className="flex-1 space-y-1">
            <Input placeholder="cth. BCA Tabungan" autoFocus {...register('name')} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>
        </div>

        {/* Row 2: jumlah / nilai */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{isRupiah ? 'Nilai Aset' : 'Jumlah'}</Label>
          {isRupiah ? (
            <Controller
              name="balance"
              control={control}
              render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
            />
          ) : (
            <div className="flex gap-2">
              <Controller
                name="balance"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                )}
              />
              <Controller
                name="satuan"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {SATUAN_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              />
            </div>
          )}
          {errors.balance && <p className="text-xs text-danger">{errors.balance.message}</p>}
        </div>

        {/* Row 3: tipe aset | include/exclude */}
        <div className={cn('gap-3', selectedCategory ? 'grid grid-cols-2' : 'flex')}>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs text-muted-foreground">Tipe Aset</Label>
            <button
              type="button"
              disabled={isEditing}
              onClick={() => setTypePickerOpen(true)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                isEditing
                  ? 'cursor-default border-border bg-muted/30 text-foreground'
                  : 'border-border bg-background hover:bg-muted/40',
                selectedCategory ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedCategory && (
                  <span
                    className="flex size-5 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: ASSET_TYPE_COLORS[selectedCategory] ?? '#64748b' }}
                  >
                    <CategoryIcon icon={ASSET_TYPE_ICONS[selectedCategory] ?? 'briefcase'} className="size-3 text-white" />
                  </span>
                )}
                <span className="truncate">{categoryLabel}</span>
              </div>
              {!isEditing && <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />}
            </button>
            {errors.category && <p className="text-xs text-danger">{errors.category.message}</p>}
          </div>

          {selectedCategory && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hitung ke Saldo</Label>
              <Controller
                name="include_in_saldo"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors',
                      field.value ? 'border-accent bg-accent-soft' : 'border-border bg-muted/30',
                    )}
                  >
                    <span className={field.value ? 'text-accent font-medium' : 'text-muted-foreground'}>
                      {field.value ? 'Termasuk' : 'Dikecualikan'}
                    </span>
                    <div className={cn('relative h-5 w-9 rounded-full transition-colors', field.value ? 'bg-accent' : 'bg-muted')}>
                      <div className={cn(
                        'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                        field.value ? 'translate-x-4' : 'translate-x-0.5',
                      )} />
                    </div>
                  </button>
                )}
              />
            </div>
          )}
        </div>

        {/* Row 4: symbol harga (only for non-rupiah) */}
        {!isRupiah && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Symbol Harga (opsional)</Label>
            <Controller
              name="price_symbol"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={field.onChange}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">— Tidak ada konverter —</option>
                  {rates.map((r) => (
                    <option key={r.symbol} value={r.symbol}>
                      {r.symbol} — {r.label} (per {r.unit})
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              Pilih rate dari Konverter untuk menampilkan nilai dalam Rupiah.
            </p>
          </div>
        )}

        {/* Row 5: catatan */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Catatan (opsional)</Label>
          <Textarea placeholder="Catatan tambahan..." {...register('notes')} rows={2} />
        </div>

        {/* Row 5: batal + simpan */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>

        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={onDelete}
            disabled={deleting || loading}
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        )}
      </form>

      {/* Icon + Color Picker */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ikon &amp; Warna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: selectedColor }}>
                <CategoryIcon icon={selectedIcon} className="size-7 text-white drop-shadow-sm" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Ikon</p>
              <div className="grid grid-cols-8 gap-1">
                {CATEGORY_ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setValue('icon', icon)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-lg transition-colors',
                      selectedIcon === icon
                        ? 'bg-accent text-accent-foreground ring-2 ring-accent'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    aria-label={icon}
                  >
                    <CategoryIcon icon={icon} className="size-4" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Warna</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className="relative size-8 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    aria-label={`Pilih warna ${color}`}
                  >
                    {selectedColor === color && (
                      <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" strokeWidth={3} aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => setPickerOpen(false)}>Selesai</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tipe Aset Picker */}
      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pilih Tipe Aset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <AssetCategorySection
              title="Aset Likuid"
              description="Dapat digunakan langsung untuk transaksi"
              types={LIQUID_ACCOUNT_TYPES as unknown as string[]}
              labels={ACCOUNT_TYPE_LABELS}
              selectedCategory={selectedCategory}
              onSelect={(cat) => {
                setValue('category', cat)
                setValue('icon', ASSET_TYPE_ICONS[cat] ?? 'briefcase')
                setValue('color', ASSET_TYPE_COLORS[cat] ?? '#64748b')
                setTypePickerOpen(false)
              }}
            />
            <AssetCategorySection
              title="Aset Non-Likuid"
              description="Investasi dan aset yang tidak untuk transaksi harian"
              types={NON_LIQUID_ASSET_TYPES as unknown as string[]}
              labels={ASSET_TYPE_LABELS}
              selectedCategory={selectedCategory}
              onSelect={(cat) => {
                setValue('category', cat)
                setValue('icon', ASSET_TYPE_ICONS[cat] ?? 'briefcase')
                setValue('color', ASSET_TYPE_COLORS[cat] ?? '#64748b')
                setValue('satuan', ASSET_TYPE_SATUAN[cat] ?? 'rupiah')
                setTypePickerOpen(false)
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AssetCategorySection({
  title,
  description,
  types,
  labels,
  selectedCategory,
  onSelect,
}: {
  title: string
  description: string
  types: string[]
  labels: Record<string, string>
  selectedCategory: string
  onSelect: (cat: string) => void
}) {
  return (
    <div>
      <p className="mb-0.5 text-sm font-semibold">{title}</p>
      <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      <div className="space-y-1">
        {types.map((type) => {
          const isSelected = selectedCategory === type
          const icon = ASSET_TYPE_ICONS[type] ?? 'briefcase'
          const color = ASSET_TYPE_COLORS[type] ?? '#64748b'
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                isSelected ? 'border-accent bg-accent-soft' : 'border-border hover:bg-muted/40',
              )}
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: color }}
              >
                <CategoryIcon icon={icon} className="size-4 text-white" />
              </span>
              <span className="flex-1 text-sm font-medium">{labels[type] ?? type}</span>
              {isSelected && <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
