'use client'

import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateAccountSchema, type CreateAccountInput, type Account } from '@/domain/types'
import { ACCOUNT_TYPE_LABELS, ACCOUNT_COLOR_OPTIONS, ACCOUNT_ICON_OPTIONS } from '@/domain/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MoneyInput } from '@/components/finance/money-input'
import { cn } from '@/lib/utils'

interface AccountFormProps {
  defaultValues?: Partial<Account>
  onSubmit: (data: CreateAccountInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function AccountForm({ defaultValues, onSubmit, onCancel, loading }: AccountFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(CreateAccountSchema) as Resolver<CreateAccountInput>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      type: (defaultValues?.type as CreateAccountInput['type']) ?? 'bank',
      currency: defaultValues?.currency ?? 'IDR',
      current_balance: defaultValues?.current_balance ? parseInt(defaultValues.current_balance, 10) : 0,
      bank_name: defaultValues?.bank_name ?? '',
      account_number: defaultValues?.account_number ?? '',
      color: defaultValues?.color ?? '#1e40af',
      icon: defaultValues?.icon ?? 'wallet',
      notes: defaultValues?.notes ?? '',
      include_in_saldo: defaultValues?.include_in_saldo !== 'false',
    },
  })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const selectedType = watch('type')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Akun</Label>
        <Input placeholder="cth. BCA Tabungan" {...register('name')} />
        {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Jenis</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {(selectedType === 'bank' || selectedType === 'ewallet') && (
        <>
          <div className="space-y-2">
            <Label>Nama Bank / Provider</Label>
            <Input placeholder="cth. BCA" {...register('bank_name')} />
          </div>
          <div className="space-y-2">
            <Label>Nomor Akun (opsional)</Label>
            <Input placeholder="cth. ****1234" {...register('account_number')} />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label>Saldo Awal</Label>
        <Controller
          name="current_balance"
          control={control}
          render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="space-y-2">
        <Label>Warna</Label>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLOR_OPTIONS.map((color) => (
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

      <div className="space-y-2">
        <Label>Ikon</Label>
        <Controller
          name="icon"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue>{selectedIcon}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_ICON_OPTIONS.map((icon) => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Catatan (opsional)</Label>
        <Textarea placeholder="Catatan tambahan..." {...register('notes')} rows={2} />
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Sertakan di Total Saldo</p>
          <p className="text-xs text-muted-foreground">Tampil di ringkasan dashboard</p>
        </div>
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
                'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                field.value ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform',
                  field.value ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          )}
        />
      </label>

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
