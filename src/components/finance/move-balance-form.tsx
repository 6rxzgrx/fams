'use client'

import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MoneyInput } from '@/components/finance/money-input'
import { MoneyDisplay } from '@/components/finance/money-display'
import type { Asset } from '@/domain/types'

interface MoveBalanceFormProps {
  accounts: Asset[]
  onSubmit: (data: { from_id: string; to_id: string; amount: number; date: string; description?: string }) => void
  onCancel: () => void
  loading?: boolean
}

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MoveBalanceForm({ accounts, onSubmit, onCancel, loading }: MoveBalanceFormProps) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayIso())
  const [description, setDescription] = useState('')

  const fromAccount = accounts.find((a) => a.id === fromId)
  const fromBalance = fromAccount ? parseInt(fromAccount.current_balance, 10) || 0 : 0

  const toOptions = accounts.filter((a) => a.id !== fromId)

  const amountError = amount > 0 && amount > fromBalance ? 'Saldo tidak cukup' : null
  const canSubmit = fromId && toId && amount > 0 && date && !amountError && !loading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ from_id: fromId, to_id: toId, amount, date, description: description || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Dari Akun</Label>
        <Select value={fromId} onValueChange={(v) => { setFromId(v); if (toId === v) setToId('') }}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih akun asal" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                <span className="flex items-center justify-between gap-4 w-full">
                  <span>{acc.name}</span>
                  <span className="text-muted-foreground tabular-nums text-xs">
                    Rp {(parseInt(acc.current_balance, 10) || 0).toLocaleString('id-ID')}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fromAccount && (
          <p className="text-xs text-muted-foreground">
            Saldo: <MoneyDisplay amount={fromBalance} className="inline text-xs" />
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <ArrowDown className="size-4 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <Label>Ke Akun</Label>
        <Select value={toId} onValueChange={setToId} disabled={!fromId}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih akun tujuan" />
          </SelectTrigger>
          <SelectContent>
            {toOptions.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Jumlah</Label>
        <MoneyInput value={amount} onChange={setAmount} disabled={loading} />
        {amountError && (
          <p className="text-xs text-destructive">{amountError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tanggal</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label>Keterangan <span className="text-muted-foreground font-normal">(opsional)</span></Label>
        <Input
          placeholder="Misal: Bayar cicilan, Top up dompet"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" variant="accent" className="flex-1" disabled={!canSubmit}>
          {loading ? 'Memindahkan...' : 'Pindahkan'}
        </Button>
      </div>
    </form>
  )
}
