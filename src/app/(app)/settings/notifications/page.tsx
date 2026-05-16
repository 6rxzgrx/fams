import type { Metadata } from 'next'
import { Bell } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Notifikasi — FAMS' }

export default function NotificationsSettingsPage() {
  return (
    <PageSkeleton
      title="Pengaturan Notifikasi"
      subtitle="Atur preferensi pengingat tagihan, acara, dan ringkasan harian."
      status="soon"
      icon={Bell}
      description="Kontrol kapan dan bagaimana FAMS mengirim notifikasi: berapa hari sebelum tagihan jatuh tempo, jam ringkasan harian, dan saluran (push, email, Google Calendar). Push notification dijadwalkan untuk v2.1."
    />
  )
}
