import type { Metadata } from 'next'
import { FileLock } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Brankas Dokumen — FAMS' }

export default function VaultPage() {
  return (
    <PageSkeleton
      title="Brankas Dokumen"
      subtitle="Arsip terenkripsi untuk KTP, paspor, asuransi, dan garansi."
      status="planned"
      icon={FileLock}
      description="Brankas Dokumen akan menyimpan metadata dokumen penting (jenis, nomor, masa berlaku) dan referensi file di Google Drive privat keluarga. Pengingat otomatis sebelum dokumen kedaluwarsa."
    />
  )
}
