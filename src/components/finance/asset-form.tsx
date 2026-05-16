'use client'

import { useForm, Controller, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateAssetSchema, type CreateAssetInput, type Asset } from '@/domain/types'
import { ASSET_TYPE_LABELS } from '@/domain/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MoneyInput } from '@/components/finance/money-input'
import { useAccounts } from '@/hooks/use-accounts'
import { cn } from '@/lib/utils'

interface AssetFormProps {
  defaultValues?: Partial<Asset>
  onSubmit: (data: CreateAssetInput) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function AssetForm({ defaultValues, onSubmit, onCancel, loading }: AssetFormProps) {
  const { accounts } = useAccounts()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(CreateAssetSchema) as Resolver<CreateAssetInput>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      type: (defaultValues?.type as CreateAssetInput['type']) ?? 'other',
      value: defaultValues?.value ? parseInt(defaultValues.value, 10) : 0,
      currency: defaultValues?.currency ?? 'IDR',
      account_id: defaultValues?.account_id ?? '',
      include_in_saldo: defaultValues?.include_in_saldo === 'true',
      notes: defaultValues?.notes ?? '',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Aset</Label>
        <Input placeholder="cth. Motor Honda Vario" {...register('name')} />
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
                {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Nilai Estimasi</Label>
        <Controller
          name="value"
          control={control}
          render={({ field }) => <MoneyInput value={field.value} onChange={field.onChange} />}
        />
        {errors.value && <p className="text-xs text-danger">{errors.value.message}</p>}
      </div>

      {accounts.length > 0 && (
        <div className="space-y-2">
          <Label>Tautkan ke Akun (opsional)</Label>
          <Controller
            name="account_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value || '__none__'} onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih akun (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Tidak ditautkan</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Hitung ke Saldo</Label>
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
                'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors',
                field.value ? 'border-accent bg-accent-soft' : 'border-border bg-muted/30',
              )}
            >
              <span className="text-muted-foreground">Masukkan nilai ke total saldo</span>
              <div className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                field.value ? 'bg-accent' : 'bg-muted',
              )}>
                <div className={cn(
                  'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
                  field.value ? 'translate-x-4' : 'translate-x-0.5',
                )} />
              </div>
            </button>
          )}
        />
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
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}
