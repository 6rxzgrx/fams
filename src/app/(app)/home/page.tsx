import type { Metadata } from 'next'
import {
  Wallet,
  CalendarRange,
  Archive,
  ArrowLeftRight,
  Bell,
  Wrench,
  FileLock,
  StickyNote,
} from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Beranda — FAMS' }

export default function HomePage() {
  return (
    <PageSkeleton
      variant="root"
      showAvatar
      title="Beranda FAMS"
      subtitle="Ringkasan seluruh modul keluarga dalam satu tampilan."
      status="soon"
      description="Halaman ini akan menampilkan ringkasan saldo, tagihan jatuh tempo, pengingat hari ini, dan aktivitas terbaru dari semua modul. Sementara skema datanya disiapkan, gunakan pintasan di bawah untuk berpindah modul."
      items={[
        { href: '/finance/dashboard',    label: 'Keuangan',         description: 'Saldo, transaksi, tagihan, aset', icon: Wallet,         color: '#0F8A6B', status: 'ready' },
        { href: '/finance/transactions', label: 'Transaksi Terbaru', description: 'Catat pemasukan & pengeluaran',  icon: ArrowLeftRight, color: '#1D4ED8', status: 'ready' },
        { href: '/calendar',             label: 'Kalender Keluarga', description: 'Acara, pengingat, dan jadwal',    icon: CalendarRange,  color: '#7C3AED', status: 'soon' },
        { href: '/notifications',        label: 'Notifikasi',        description: 'Pengingat & peringatan aktif',    icon: Bell,           color: '#A66400', status: 'soon' },
        { href: '/other/maintenance',    label: 'Perawatan',         description: 'AC, kendaraan, peralatan rumah',  icon: Wrench,         color: '#0369A1', status: 'soon' },
        { href: '/other/vault',          label: 'Brankas Dokumen',    description: 'KTP, paspor, asuransi, garansi', icon: FileLock,       color: '#B42318', status: 'soon' },
        { href: '/other/notes',          label: 'Catatan',           description: 'Aturan rumah, password, perjanjian', icon: StickyNote,  color: '#CA8A04', status: 'soon' },
        { href: '/finance/assets',       label: 'Aset',              description: 'Properti, kendaraan, emas',       icon: Archive,        color: '#0F8A6B', status: 'ready' },
      ]}
    />
  )
}
