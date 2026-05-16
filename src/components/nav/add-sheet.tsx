'use client'

import { Camera, PenLine } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: () => void
  onManual: () => void
}

export function AddSheet({ open, onOpenChange, onScan, onManual }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs gap-0 p-0 overflow-hidden">
        <DialogTitle className="sr-only">Tambah Transaksi</DialogTitle>

        <button
          type="button"
          onClick={() => { onOpenChange(false); onScan() }}
          className={cn(
            'flex items-center gap-4 px-6 py-5 text-left',
            'transition-colors hover:bg-muted active:scale-[0.99] border-b border-border',
          )}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-foreground">
            <Camera className="size-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Pindai Struk</p>
            <p className="text-[12px] text-muted-foreground">Foto struk, AI isi otomatis</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { onOpenChange(false); onManual() }}
          className={cn(
            'flex items-center gap-4 px-6 py-5 text-left',
            'transition-colors hover:bg-muted active:scale-[0.99]',
          )}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-muted text-foreground">
            <PenLine className="size-5" strokeWidth={2.25} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Catat Manual</p>
            <p className="text-[12px] text-muted-foreground">Tambah transaksi langsung</p>
          </div>
        </button>
      </DialogContent>
    </Dialog>
  )
}
