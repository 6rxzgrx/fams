'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check } from 'lucide-react'
import {
  CreateTransactionCategorySchema,
  type CategoryType,
  type CreateTransactionCategoryInput,
  type TransactionCategory,
} from '@/domain/types'
import { CATEGORY_TYPE_LABELS, getAvailableParentCategories, hasCategoryChildren } from '@/domain/categories'
import { BUDGET_TYPES, BUDGET_TYPE_LABELS, BUDGET_TYPE_COLORS, CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from '@/domain/constants'
import { CategoryIcon } from '@/components/finance/category-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface CategoryFormProps {
  categories: TransactionCategory[]
  defaultValues?: Partial<Pick<TransactionCategory, 'id' | 'name' | 'type' | 'icon' | 'color' | 'parent_id' | 'budget_type'>>
  onSubmit: (data: CreateTransactionCategoryInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
  loading?: boolean
  deleting?: boolean
  forceType?: CategoryType
}

const TYPE_OPTIONS: CategoryType[] = ['expense', 'income', 'transfer']

export function CategoryForm({
  categories,
  defaultValues,
  onSubmit,
  onCancel,
  onDelete,
  loading,
  deleting,
  forceType,
}: CategoryFormProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTransactionCategoryInput>({
    resolver: zodResolver(CreateTransactionCategorySchema) as Resolver<CreateTransactionCategoryInput>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      type: (defaultValues?.type as CreateTransactionCategoryInput['type']) ?? 'expense',
      icon: defaultValues?.icon ?? 'tag',
      color: defaultValues?.color ?? '#64748b',
      parent_id: defaultValues?.parent_id ?? '',
      budget_type: defaultValues?.budget_type ?? '',
    },
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const selectedType = watch('type')
  const parentId = watch('parent_id')
  const currentCategoryId = defaultValues?.id
  const availableParents = getAvailableParentCategories(categories, selectedType, currentCategoryId)
  const isParentCategory = currentCategoryId ? hasCategoryChildren(categories, currentCategoryId) : false
  const parentSelectionDisabled = selectedType === 'transfer' || isParentCategory
  const isRootCategory = !parentId
  const selectedParent = parentId ? categories.find((c) => c.id === parentId) : undefined
  const inheritedBudgetType = selectedParent?.budget_type ?? ''

  useEffect(() => {
    if (forceType && selectedType !== forceType) {
      setValue('type', forceType)
    }
  }, [forceType, selectedType, setValue])

  useEffect(() => {
    if (selectedType === 'transfer' && parentId) {
      setValue('parent_id', '')
    }
  }, [parentId, selectedType, setValue])

  useEffect(() => {
    if (parentId) setValue('budget_type', '')
  }, [parentId, setValue])

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Row 1: Icon+Color button | Name input */}
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
            <Input placeholder="cth. Belanja Bulanan" autoFocus {...register('name')} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>
        </div>

        {/* Row 2: Jenis */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Jenis</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={!!forceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CATEGORY_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Row 3: Induk Kategori */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Induk Kategori</Label>
          <Controller
            name="parent_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || '__root__'}
                onValueChange={(value) => field.onChange(value === '__root__' ? '' : value)}
                disabled={parentSelectionDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tanpa induk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">Kategori mandiri</SelectItem>
                  {availableParents.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {(isParentCategory || selectedType === 'transfer') && (
            <p className="text-xs text-muted-foreground">
              {isParentCategory
                ? 'Kategori yang sudah punya turunan tidak bisa dipindah.'
                : 'Kategori transfer selalu berada di level pertama.'}
            </p>
          )}
        </div>

        {/* Row 4: Tipe Anggaran — editable for expense root, read-only for children */}
        {selectedType === 'expense' && isRootCategory && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipe Anggaran</Label>
            <Controller
              name="budget_type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-1.5">
                  {BUDGET_TYPES.map((bt) => {
                    const color = BUDGET_TYPE_COLORS[bt]
                    const isSelected = field.value === bt
                    return (
                      <button
                        key={bt}
                        type="button"
                        onClick={() => field.onChange(isSelected ? '' : bt)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all',
                          isSelected
                            ? 'border-transparent text-white'
                            : 'border-border text-muted-foreground hover:bg-muted/60',
                        )}
                        style={isSelected ? { backgroundColor: color } : {}}
                      >
                        {BUDGET_TYPE_LABELS[bt]}
                      </button>
                    )
                  })}
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">Semua kategori anak akan mengikuti tipe ini.</p>
          </div>
        )}

        {selectedType === 'expense' && !isRootCategory && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipe Anggaran</Label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              {inheritedBudgetType ? (
                <>
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: BUDGET_TYPE_COLORS[inheritedBudgetType as keyof typeof BUDGET_TYPE_COLORS] }}
                  />
                  <span className="text-sm font-medium">
                    {BUDGET_TYPE_LABELS[inheritedBudgetType as keyof typeof BUDGET_TYPE_LABELS] ?? inheritedBudgetType}
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Belum ditentukan di kategori induk</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Diwariskan dari kategori induk.</p>
          </div>
        )}

        {/* Row 5: Batal + Simpan */}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>

        {/* Row 6: Hapus (only in edit mode) */}
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={onDelete}
            disabled={deleting || loading}
          >
            {deleting ? 'Menghapus...' : 'Hapus Kategori'}
          </Button>
        )}
      </form>

      {/* Icon + Color Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ikon &amp; Warna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Live preview */}
            <div className="flex justify-center">
              <div
                className="flex size-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: selectedColor }}
              >
                <CategoryIcon icon={selectedIcon} className="size-7 text-white drop-shadow-sm" />
              </div>
            </div>

            {/* Icon grid */}
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

            {/* Color palette */}
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
                      <Check
                        className="absolute inset-0 m-auto size-4 text-white drop-shadow"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={() => setPickerOpen(false)}>
              Selesai
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
