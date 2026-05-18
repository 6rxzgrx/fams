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

        <div className="flex flex-col gap-1 p-2">
          <button
            type="button"
            onClick={() => { onOpenChange(false); onScan() }}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left',
              'bg-accent-soft transition-colors duration-150 hover:bg-accent-soft/80',
            )}
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <Camera className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Pindai Struk</p>
              <p className="text-[12px] text-muted-foreground">Foto struk, AI isi otomatis</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { onOpenChange(false); onManual() }}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-3 text-left',
              'transition-colors duration-150 hover:bg-muted',
            )}
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
              <PenLine className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Catat Manual</p>
              <p className="text-[12px] text-muted-foreground">Tambah transaksi langsung</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
