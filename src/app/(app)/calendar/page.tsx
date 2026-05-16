import type { Metadata } from 'next'
import { CalendarRange, CalendarDays, Bell } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Kalender — FAMS' }

export default function CalendarPage() {
  return (
    <PageSkeleton
      title="Kalender"
      subtitle="Tampilan kalender bulanan untuk acara dan pengingat keluarga."
      status="soon"
      icon={CalendarRange}
      description="Tampilan kalender akan menggabungkan acara keluarga, pengingat tagihan, dan jadwal perawatan dalam satu grid bulanan. Sinkron dengan Google Calendar."
      items={[
        { href: '/calendar/events',    label: 'Acara Keluarga', description: 'Ulang tahun, liburan, kegiatan', icon: CalendarDays, status: 'soon' },
        { href: '/calendar/reminders', label: 'Pengingat',      description: 'Satu kali & berulang',           icon: Bell,         status: 'ready' },
      ]}
    />
  )
}
