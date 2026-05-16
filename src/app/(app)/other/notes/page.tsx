import type { Metadata } from 'next'
import { StickyNote } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Catatan — FAMS' }

export default function NotesPage() {
  return (
    <PageSkeleton
      title="Catatan"
      subtitle="Aturan rumah, kontak darurat, dan perjanjian keluarga."
      status="soon"
      icon={StickyNote}
      description="Modul Catatan menampung informasi penting non-keuangan: aturan rumah, kontak darurat, perjanjian, dan rahasia bersama. Mendukung pengelompokan dan kontrol akses per anggota."
    />
  )
}
