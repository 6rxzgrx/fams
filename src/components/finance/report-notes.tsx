'use client'

import { useState, useEffect } from 'react'
import { Save, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useReportNote, useSaveReportNote } from '@/hooks/use-report-notes'

const MAX = 5000

export function ReportNotes({ month }: { month: string }) {
  const { content: savedContent, isLoading, mutate } = useReportNote(month)
  const { trigger: save, isMutating: saving } = useSaveReportNote()

  const [draft, setDraft] = useState('')
  const [dirty, setDirty] = useState(false)

  // Sync draft when month changes or data loads
  useEffect(() => {
    setDraft(savedContent ?? '')
    setDirty(false)
  }, [savedContent, month])

  async function handleSave() {
    const res = await save({ month, content: draft })
    if (!res.ok) {
      toast.error(res.error ?? 'Gagal menyimpan catatan')
      return
    }
    toast.success('Catatan tersimpan')
    setDirty(false)
    mutate()
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Catatan
            </p>
            <p className="font-bold text-[15px] tracking-tight mt-0.5">Catatan Bulan Ini</p>
          </div>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSave}
          disabled={saving || !dirty}
        >
          <Save className="size-3.5" />
          {saving ? 'Menyimpan…' : 'Simpan'}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : (
        <>
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setDirty(true)
            }}
            placeholder={`Tulis catatan keuangan untuk bulan ini...\n\nContoh: pencapaian bulan ini, evaluasi pengeluaran, target bulan depan.`}
            maxLength={MAX}
            rows={6}
            className="resize-none text-[13.5px]"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10.5px] text-muted-foreground">
              {dirty && <span className="text-amber-500 font-medium">Belum disimpan · </span>}
              Tersimpan di Google Sheets
            </p>
            <p className="text-[10.5px] text-muted-foreground tabular-nums">
              {draft.length}/{MAX}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
