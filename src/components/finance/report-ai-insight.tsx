'use client'

import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useReportInsight, useGenerateReportInsight, type ReportInsightSummary } from '@/hooks/use-report-insight'

interface Props {
  month: string
  summary: ReportInsightSummary
  className?: string
}

function InsightText({ text }: { text: string }) {
  const [summaryPart, recPart] = text.split(/REKOMENDASI:/i)

  const summary = summaryPart.replace(/^RINGKASAN:/i, '').trim()
  const bullets = recPart
    ?.split('\n')
    .map((l) => l.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean) ?? []

  return (
    <div className="space-y-3">
      {summary && (
        <p className="text-[13px] leading-relaxed text-foreground">{summary}</p>
      )}
      {bullets.length > 0 && (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-snug">
              <span className="mt-0.5 shrink-0 size-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                {i + 1}
              </span>
              <span className="text-foreground/90">{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ReportAiInsight({ month, summary, className }: Props) {
  const { insight, generatedAt, isLoading: loadingInsight, mutate } = useReportInsight(month)
  const { trigger, isMutating, error } = useGenerateReportInsight()

  async function handleGenerate() {
    const res = await trigger({ month, summary })
    if (res?.ok) mutate()
  }

  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className={cn('rounded-2xl border border-border bg-surface p-5', className)}>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="flex size-7 items-center justify-center rounded-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
        >
          <Sparkles className="size-4 text-white" />
        </span>
        <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          AI Insight
        </p>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-7 gap-1.5 px-3 text-[11px]"
          onClick={handleGenerate}
          disabled={isMutating || loadingInsight}
        >
          <RefreshCw className={cn('size-3', isMutating && 'animate-spin')} />
          {insight ? 'Perbarui' : 'Generate'}
        </Button>
      </div>

      {/* Loading skeleton while fetching saved insight */}
      {loadingInsight && (
        <div className="space-y-2.5">
          {[80, 100, 65, 90].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-muted animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      )}

      {/* Generating in progress */}
      {!loadingInsight && isMutating && (
        <div className="space-y-2.5">
          {[80, 100, 65, 90, 75].map((w, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-muted animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
          <p className="text-[11px] text-muted-foreground mt-1">Sedang menganalisis data keuangan…</p>
        </div>
      )}

      {/* Error */}
      {!loadingInsight && !isMutating && error && (
        <div className="flex items-center gap-2 text-danger text-[12px]">
          <AlertCircle className="size-4 shrink-0" />
          <span>Gagal menghasilkan insight. Coba lagi.</span>
        </div>
      )}

      {/* Insight content */}
      {!loadingInsight && !isMutating && !error && insight && (
        <>
          <InsightText text={insight} />
          {generatedLabel && (
            <p className="mt-4 text-[10.5px] text-muted-foreground">
              Dibuat {generatedLabel}
            </p>
          )}
        </>
      )}

      {/* Empty state */}
      {!loadingInsight && !isMutating && !error && !insight && (
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Tekan <strong>Generate</strong> untuk mendapatkan analisis keuangan otomatis — pola belanja, perbandingan tren, dan saran personal dari AI.
        </p>
      )}
    </div>
  )
}
