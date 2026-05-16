'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, ImagePlus, RotateCcw, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TransactionForm } from '@/components/finance/transaction-form'
import { useCreateTransaction } from '@/hooks/use-transactions'
import { cn } from '@/lib/utils'
import type { CreateTransactionInput } from '@/domain/types'

type Step = 'camera' | 'preview' | 'extracting' | 'review'

interface ExtractedData {
  type: 'expense' | 'income'
  amount: number
  description: string
  date: string
  merchant: string
  category_hint: string
  confidence: number
  notes: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ScanDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('camera')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedData | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { trigger: createTx, isMutating: saving } = useCreateTransaction()

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setCameraError('Kamera tidak dapat diakses. Gunakan tombol "Pilih Foto" untuk upload dari galeri.')
    }
  }, [])

  useEffect(() => {
    if (open && step === 'camera') {
      startCamera()
    }
    return () => {
      if (!open) stopCamera()
    }
  }, [open, step, startCamera, stopCamera])

  function handleClose() {
    stopCamera()
    setStep('camera')
    setCapturedImage(null)
    setExtracted(null)
    setCameraError(null)
    onOpenChange(false)
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    stopCamera()
    setCapturedImage(dataUrl)
    setStep('preview')
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      stopCamera()
      setCapturedImage(reader.result as string)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  async function extractFromImage() {
    if (!capturedImage) return
    setStep('extracting')
    try {
      const base64 = capturedImage.split(',')[1]
      const res = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setExtracted(data.data)
      setStep('review')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengekstrak data')
      setStep('preview')
    }
  }

  async function handleSubmit(formData: CreateTransactionInput) {
    const res = await createTx(formData)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Transaksi tersimpan.')
    handleClose()
  }

  function retake() {
    setCapturedImage(null)
    setExtracted(null)
    setStep('camera')
    startCamera()
  }

  const defaultFormValues = extracted
    ? {
        type: extracted.type,
        amount: extracted.amount,
        description: extracted.merchant ? `${extracted.description} — ${extracted.merchant}` : extracted.description,
        date: extracted.date || format(new Date(), 'yyyy-MM-dd'),
        notes: extracted.notes,
      }
    : undefined

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="gap-0 p-0 overflow-hidden sm:max-w-sm h-[90svh] flex flex-col">
        <DialogTitle className="sr-only">Pindai Struk</DialogTitle>

        {/* Camera / preview area */}
        {(step === 'camera' || step === 'preview') && (
          <div className="relative flex-1 bg-black overflow-hidden">
            {step === 'camera' && (
              <>
                {cameraError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
                    <Camera className="size-10 opacity-50" strokeWidth={1.5} />
                    <p className="text-sm opacity-80">{cameraError}</p>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="text-black">
                      <ImagePlus className="size-4 mr-2" />
                      Pilih Foto
                    </Button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Corner guides */}
                {!cameraError && (
                  <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-white/30" />
                )}
              </>
            )}

            {step === 'preview' && capturedImage && (
              <img
                src={capturedImage}
                alt="Foto struk"
                className="h-full w-full object-contain"
              />
            )}

            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        )}

        {/* Extracting */}
        {step === 'extracting' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            {capturedImage && (
              <img src={capturedImage} alt="" className="max-h-40 rounded-lg object-contain opacity-60" />
            )}
            <Loader2 className="size-8 animate-spin text-accent" />
            <div>
              <p className="font-semibold">Mengekstrak data…</p>
              <p className="text-[13px] text-muted-foreground">Gemini sedang menganalisis struk</p>
            </div>
          </div>
        )}

        {/* Review form */}
        {step === 'review' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {capturedImage && (
              <div className="shrink-0 border-b border-border bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  <img src={capturedImage} alt="" className="h-14 w-14 rounded-md object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-accent shrink-0" strokeWidth={2} />
                      <p className="text-[12px] font-semibold text-accent">AI Extraction</p>
                      {extracted && (
                        <span className={cn(
                          'text-[11px] font-medium px-1.5 py-0.5 rounded-full',
                          extracted.confidence >= 0.7 ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
                        )}>
                          {Math.round(extracted.confidence * 100)}% yakin
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground">Periksa & koreksi data sebelum simpan</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5">
              <TransactionForm
                defaultValues={defaultFormValues as Parameters<typeof TransactionForm>[0]['defaultValues']}
                onSubmit={handleSubmit}
                onCancel={retake}
                loading={saving}
                cancelLabel="Ulang"
              />
            </div>
          </div>
        )}

        {/* Bottom actions */}
        {(step === 'camera' || step === 'preview') && (
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border bg-background px-5 py-4">
            {step === 'camera' && (
              <>
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} aria-label="Pilih dari galeri">
                  <ImagePlus className="size-5" strokeWidth={2} />
                </Button>
                <button
                  onClick={capturePhoto}
                  disabled={!!cameraError}
                  className={cn(
                    'size-16 rounded-full border-4 border-accent bg-white shadow-md',
                    'transition-transform active:scale-95',
                    cameraError && 'opacity-40 cursor-not-allowed',
                  )}
                  aria-label="Ambil foto"
                />
                <div className="size-10" />
              </>
            )}
            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={retake} className="flex-1">
                  <RotateCcw className="size-4 mr-1.5" strokeWidth={2.25} />
                  Ulang
                </Button>
                <Button onClick={extractFromImage} className="flex-1">
                  <Sparkles className="size-4 mr-1.5" strokeWidth={2.25} />
                  Ekstrak
                </Button>
              </>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleFileSelect}
        />
      </DialogContent>
    </Dialog>
  )
}
