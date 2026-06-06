'use client'

import { useEffect, useMemo } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star } from 'lucide-react'
import { CreateTransactionSchema, type CreateTransactionInput, type Transaction } from '@/domain/types'
import { CATEGORY_TYPE_LABELS, getCategoryTypeFromId } from '@/domain/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { MoneyInput } from '@/components/finance/money-input'
import { TransactionCategoryPicker } from '@/components/finance/transaction-category-picker'
import { AccountOption } from '@/components/finance/account-option'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useFavoriteAccountIds } from '@/hooks/use-favorite-account-ids'
import { format } from 'date-fns'

interface TransactionFormProps {
  defaultValues?: Partial<Transaction>
  onSubmit: (data: CreateTransactionInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
  cancelLabel?: string
}

export function TransactionForm({ defaultValues, onSubmit, onCancel, loading, cancelLabel = 'Batal' }: TransactionFormProps) {
  const { accounts } = useAccounts()
  const { categories } = useCategories()
  const { favoriteIds, isFavorite } = useFavoriteAccountIds()

  const sortedAccounts = useMemo(() => {
    const favs = accounts.filter((a) => favoriteIds.includes(a.id))
      .sort((a, b) => favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id))
    const rest = accounts.filter((a) => !favoriteIds.includes(a.id))
    return [...favs, ...rest]
  }, [accounts, favoriteIds])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(CreateTransactionSchema) as Resolver<CreateTransactionInput>,
    defaultValues: {
      type: (defaultValues?.type as CreateTransactionInput['type']) ?? 'expense',
      account_id: defaultValues?.account_id ?? accounts[0]?.id ?? '',
      category_id: defaultValues?.category_id ?? '',
      amount: defaultValues?.amount ? parseInt(defaultValues.amount, 10) : 0,
      description: defaultValues?.description ?? '',
      date: defaultValues?.date ?? format(new Date(), 'yyyy-MM-dd'),
      reference_no: defaultValues?.reference_no ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  const accountId = watch('account_id')
  const selectedCategoryId = watch('category_id')
  const selectedType = watch('type')
  const selectedCategoryType = getCategoryTypeFromId(categories, selectedCategoryId)

  useEffect(() => {
    if (!accountId && accounts[0]?.id) {
      setValue('account_id', accounts[0].id)
    }
  }, [accountId, accounts, setValue])

  useEffect(() => {
    if (!selectedCategoryType || selectedCategoryType === selectedType) return
    setValue('type', selectedCategoryType, { shouldValidate: true })
  }, [selectedCategoryType, selectedType, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Row 1: Nominal */}
      <div className="space-y-2">
        <Label>Nominal</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <MoneyInput value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
      </div>

      {/* Row 2: Deskripsi Singkat */}
      <div className="space-y-2">
        <Label>Deskripsi Singkat</Label>
        <Input placeholder="cth. Makan siang" {...register('description')} />
        {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
      </div>

      {/* Row 3: Kategori + Tanggal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <TransactionCategoryPicker
                categories={categories}
                value={field.value}
                onChange={field.onChange}
                defaultType={selectedType === 'income' || selectedType === 'expense' ? selectedType : 'expense'}
                label="Buka pilihan kategori"
                placeholder="Pilih kategori"
              />
            )}
          />
          {errors.category_id && <p className="text-xs text-danger">{errors.category_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Jenis transaksi: {CATEGORY_TYPE_LABELS[selectedCategoryType ?? (selectedType === 'income' || selectedType === 'expense' ? selectedType : 'expense')]}
      </p>

      {/* Row 4: Akun */}
      <div className="space-y-2">
        <Label>Akun</Label>
        <Controller
          name="account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                {(() => {
                  const acc = accounts.find((a) => a.id === field.value)
                  if (!acc) return <span className="text-muted-foreground">Pilih akun</span>
                  return <AccountOption account={acc} />
                })()}
              </SelectTrigger>
              <SelectContent>
                {sortedAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    <AccountOption
                      account={acc}
                      trailing={
                        isFavorite(acc.id) ? (
                          <Star className="size-3 shrink-0 fill-accent text-accent" strokeWidth={2} aria-hidden="true" />
                        ) : undefined
                      }
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.account_id && <p className="text-xs text-danger">{errors.account_id.message}</p>}
      </div>

      {/* Row 5: Catatan */}
      <div className="space-y-2">
        <Label>Catatan (opsional)</Label>
        <Textarea placeholder="Catatan tambahan..." {...register('notes')} rows={2} />
      </div>

      {/* Row 6: Batal + Simpan */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
