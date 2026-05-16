import type { Metadata } from 'next'
import { Shield } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Riwayat Aktivitas — FAMS' }

export default function AuditLogPage() {
  return (
    <PageSkeleton
      title="Riwayat Aktivitas"
      subtitle="Catatan setiap perubahan data — siapa, kapan, dan apa."
      status="soon"
      icon={Shield}
      description="Halaman penuh untuk audit log: filter per anggota, modul, jenis aksi, dan rentang tanggal. Saat ini ringkasannya tersedia di halaman Pengaturan utama."
    />
  )
}
