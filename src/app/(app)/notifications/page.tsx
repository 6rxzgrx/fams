import type { Metadata } from 'next'
import { Bell, AlertTriangle, CalendarClock, Activity } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Notifikasi — FAMS' }

export default function NotificationsFeedPage() {
  return (
    <PageSkeleton
      title="Notifikasi"
      subtitle="Pengingat aktif, tagihan menjelang jatuh tempo, dan aktivitas terbaru."
      status="soon"
      icon={Bell}
      description="Feed gabungan dari pengingat (one-time + recurring), tagihan yang akan jatuh tempo dalam 7 hari, dan aktivitas penting keluarga. Tap item untuk menuju modul terkait."
      items={[
        { href: '/calendar/reminders',  label: 'Pengingat Aktif',     description: 'Lihat semua pengingat',          icon: CalendarClock, status: 'ready' },
        { href: '/finance/bills',       label: 'Tagihan Mendatang',   description: 'Jatuh tempo dalam 7 hari',       icon: AlertTriangle, status: 'ready' },
        { href: '/settings/audit-log',  label: 'Aktivitas Terbaru',   description: 'Perubahan data 24 jam terakhir', icon: Activity,      status: 'soon' },
      ]}
    />
  )
}
