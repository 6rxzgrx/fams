import type { Metadata } from 'next'
import { Camera } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Pindai Struk — FAMS' }

export default function ScanPage() {
  return (
    <PageSkeleton
      title="Pindai Struk"
      subtitle="Foto struk → Gemini ekstrak → tinjau → simpan."
      status="soon"
      icon={Camera}
      description="Modul Pindai Struk membuka kamera (atau pilih dari galeri), mengirim gambar ke Gemini Vision, lalu menampilkan draf transaksi yang dapat diedit. Pengguna selalu meninjau sebelum menyimpan — tidak ada auto-save."
    />
  )
}
