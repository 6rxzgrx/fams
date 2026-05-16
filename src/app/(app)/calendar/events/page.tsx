import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Acara — FAMS' }

export default function EventsPage() {
  return (
    <PageSkeleton
      title="Acara Keluarga"
      subtitle="Ulang tahun, liburan, dan jadwal kegiatan bersama."
      status="soon"
      icon={CalendarDays}
      description="Modul Acara akan menyimpan ulang tahun anggota keluarga, hari libur, dan jadwal kegiatan rutin. Acara dapat disinkronkan ke Google Calendar dan memicu notifikasi sebelum hari-H."
    />
  )
}
