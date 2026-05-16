'use client'

import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TransactionForm } from '@/components/finance/transaction-form'
import { useCreateTransaction } from '@/hooks/use-transactions'
import type { CreateTransactionInput } from '@/domain/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTransactionDialog({ open, onOpenChange }: Props) {
  const { trigger: createTx, isMutating: saving } = useCreateTransaction()

  async function handleSubmit(data: CreateTransactionInput) {
    const res = await createTx(data)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Transaksi tersimpan.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catat Transaksi</DialogTitle>
        </DialogHeader>
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          loading={saving}
        />
      </DialogContent>
    </Dialog>
  )
}
