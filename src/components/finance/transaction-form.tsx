'use client'

import { useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateTransactionSchema, type CreateTransactionInput, type Transaction } from '@/domain/types'
import { CATEGORY_TYPE_LABELS, getCategoryTypeFromId } from '@/domain/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MoneyInput } from '@/components/finance/money-input'
import { TransactionCategoryPicker } from '@/components/finance/transaction-category-picker'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
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
      {/* Account */}
      <div className="space-y-2">
        <Label>Akun</Label>
        <Controller
          name="account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.account_id && <p className="text-xs text-danger">{errors.account_id.message}</p>}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label>Jumlah</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <MoneyInput value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Input placeholder="cth. Makan siang" {...register('description')} />
        {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Tanggal</Label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
      </div>

      {/* Category */}
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
              defaultType={selectedType === 'income' || selectedType === 'expense' || selectedType === 'transfer' ? selectedType : 'expense'}
              label="Buka pilihan kategori"
              placeholder="Pilih kategori"
            />
          )}
        />
        <p className="text-xs text-muted-foreground">
          Jenis transaksi: {CATEGORY_TYPE_LABELS[selectedCategoryType ?? (selectedType === 'income' || selectedType === 'expense' || selectedType === 'transfer' ? selectedType : 'expense')]}
        </p>
        {errors.category_id && <p className="text-xs text-danger">{errors.category_id.message}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Catatan (opsional)</Label>
        <Textarea placeholder="Catatan tambahan..." {...register('notes')} rows={2} />
      </div>

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
