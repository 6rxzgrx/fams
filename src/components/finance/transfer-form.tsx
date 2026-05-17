'use client'

import { useEffect } from 'react'
import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateTransferSchema, type CreateTransferInput } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategoryIcon } from '@/components/finance/category-icon'
import { MoneyInput } from '@/components/finance/money-input'
import { TransactionCategoryPicker } from '@/components/finance/transaction-category-picker'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { ASSET_TYPE_ICONS, ASSET_TYPE_COLORS } from '@/domain/constants'
import { format } from 'date-fns'

interface TransferFormProps {
  defaultFromAccountId?: string
  onSubmit: (data: CreateTransferInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function TransferForm({ defaultFromAccountId, onSubmit, onCancel, loading }: TransferFormProps) {
  const { accounts } = useAccounts()
  const { categories } = useCategories()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTransferInput>({
    resolver: zodResolver(CreateTransferSchema) as Resolver<CreateTransferInput>,
    defaultValues: {
      from_account_id: defaultFromAccountId ?? accounts[0]?.id ?? '',
      to_account_id: '',
      category_id: '',
      amount: 0,
      description: 'Transfer',
      date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  })

  const fromId = watch('from_account_id')
  const categoryId = watch('category_id')
  const transferCategories = categories.filter((category) => category.type === 'transfer')

  useEffect(() => {
    if (!fromId && accounts[0]?.id) {
      setValue('from_account_id', accounts[0].id)
    }
  }, [accounts, fromId, setValue])

  useEffect(() => {
    if (categoryId || !transferCategories[0]?.id) return
    setValue('category_id', transferCategories[0].id)
  }, [categoryId, setValue, transferCategories])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Dari Akun</Label>
        <Controller
          name="from_account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                {(() => {
                  const acc = accounts.find((a) => a.id === field.value)
                  if (!acc) return <span className="text-muted-foreground">Pilih akun sumber</span>
                  const icon = acc.icon ?? ASSET_TYPE_ICONS[acc.type] ?? 'wallet'
                  const color = acc.color ?? ASSET_TYPE_COLORS[acc.type] ?? '#64748b'
                  return (
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                        <CategoryIcon icon={icon} className="size-3" />
                      </span>
                      <span>{acc.name}</span>
                    </div>
                  )
                })()}
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => {
                  const icon = acc.icon ?? ASSET_TYPE_ICONS[acc.type] ?? 'wallet'
                  const color = acc.color ?? ASSET_TYPE_COLORS[acc.type] ?? '#64748b'
                  return (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                          <CategoryIcon icon={icon} className="size-3" />
                        </span>
                        <span>{acc.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.from_account_id && <p className="text-xs text-danger">{errors.from_account_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Ke Akun</Label>
        <Controller
          name="to_account_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                {(() => {
                  const acc = accounts.find((a) => a.id === field.value)
                  if (!acc) return <span className="text-muted-foreground">Pilih akun tujuan</span>
                  const icon = acc.icon ?? ASSET_TYPE_ICONS[acc.type] ?? 'wallet'
                  const color = acc.color ?? ASSET_TYPE_COLORS[acc.type] ?? '#64748b'
                  return (
                    <div className="flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                        <CategoryIcon icon={icon} className="size-3" />
                      </span>
                      <span>{acc.name}</span>
                    </div>
                  )
                })()}
              </SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.id !== fromId).map((acc) => {
                  const icon = acc.icon ?? ASSET_TYPE_ICONS[acc.type] ?? 'wallet'
                  const color = acc.color ?? ASSET_TYPE_COLORS[acc.type] ?? '#64748b'
                  return (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                          <CategoryIcon icon={icon} className="size-3" />
                        </span>
                        <span>{acc.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        />
        {errors.to_account_id && <p className="text-xs text-danger">{errors.to_account_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Jumlah</Label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
        />
        {errors.amount && <p className="text-xs text-danger">{errors.amount.message}</p>}
      </div>

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
              allowedTypes={['transfer']}
              defaultType="transfer"
              label="Pilih kategori transfer"
              placeholder="Pilih kategori transfer"
            />
          )}
        />
        {errors.category_id && <p className="text-xs text-danger">{errors.category_id.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Input placeholder="cth. Transfer bulanan" {...register('description')} />
        {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tanggal</Label>
        <Input type="date" {...register('date')} />
        {errors.date && <p className="text-xs text-danger">{errors.date.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Catatan (opsional)</Label>
        <Textarea placeholder="Catatan tambahan..." {...register('notes')} rows={2} />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Memproses...' : 'Transfer'}
        </Button>
      </div>
    </form>
  )
}
