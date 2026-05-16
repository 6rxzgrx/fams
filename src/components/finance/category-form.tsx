'use client'

import { useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateTransactionCategorySchema,
  type CategoryType,
  type CreateTransactionCategoryInput,
  type TransactionCategory,
} from '@/domain/types'
import { CATEGORY_TYPE_LABELS, getAvailableParentCategories, hasCategoryChildren } from '@/domain/categories'
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from '@/domain/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface CategoryFormProps {
  categories: TransactionCategory[]
  defaultValues?: Partial<Pick<TransactionCategory, 'id' | 'name' | 'type' | 'icon' | 'color' | 'parent_id'>>
  onSubmit: (data: CreateTransactionCategoryInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
  forceType?: CategoryType
}

const TYPE_OPTIONS: CategoryType[] = ['expense', 'income', 'transfer']

export function CategoryForm({ categories, defaultValues, onSubmit, onCancel, loading, forceType }: CategoryFormProps) {
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
    },
  })

  const selectedColor = watch('color')
  const selectedType = watch('type')
  const parentId = watch('parent_id')
  const currentCategoryId = defaultValues?.id
  const availableParents = getAvailableParentCategories(categories, selectedType, currentCategoryId)
  const isParentCategory = currentCategoryId ? hasCategoryChildren(categories, currentCategoryId) : false
  const parentSelectionDisabled = selectedType === 'transfer' || isParentCategory

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Kategori</Label>
        <Input placeholder="cth. Belanja Bulanan" {...register('name')} />
        {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Jenis</Label>
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

      <div className="space-y-2">
        <Label>Induk Kategori</Label>
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
        <p className="text-xs text-muted-foreground">
          {isParentCategory
            ? 'Kategori induk yang sudah punya turunan tidak bisa dipindah menjadi anak.'
            : selectedType === 'transfer'
              ? 'Kategori transfer selalu berada di level pertama.'
              : 'Maksimal hanya dua level: induk lalu anak.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Ikon</Label>
        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_ICON_OPTIONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Warna</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={cn(
                'size-8 rounded-full border-2',
                selectedColor === color ? 'border-foreground ring-2 ring-offset-2 ring-offset-background' : 'border-transparent',
              )}
              style={{ backgroundColor: color }}
              aria-label={`Pilih warna ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
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
