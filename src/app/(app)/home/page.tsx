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
      title="Beranda FAMS"
      subtitle="Ringkasan seluruh modul keluarga dalam satu tampilan."
      status="soon"
      description="Halaman ini akan menampilkan ringkasan saldo, tagihan jatuh tempo, pengingat hari ini, dan aktivitas terbaru dari semua modul. Sementara skema datanya disiapkan, gunakan pintasan di bawah untuk berpindah modul."
      items={[
        { href: '/finance/dashboard',    label: 'Keuangan',         description: 'Saldo, transaksi, tagihan, aset', icon: Wallet,         status: 'ready' },
        { href: '/finance/transactions', label: 'Transaksi Terbaru', description: 'Catat pemasukan & pengeluaran',  icon: ArrowLeftRight, status: 'ready' },
        { href: '/calendar',             label: 'Kalender Keluarga', description: 'Acara, pengingat, dan jadwal',    icon: CalendarRange,  status: 'soon' },
        { href: '/notifications',        label: 'Notifikasi',        description: 'Pengingat & peringatan aktif',    icon: Bell,           status: 'soon' },
        { href: '/other/maintenance',    label: 'Perawatan',         description: 'AC, kendaraan, peralatan rumah',  icon: Wrench,         status: 'soon' },
        { href: '/other/vault',          label: 'Brankas Dokumen',    description: 'KTP, paspor, asuransi, garansi', icon: FileLock,       status: 'soon' },
        { href: '/other/notes',          label: 'Catatan',           description: 'Aturan rumah, password, perjanjian', icon: StickyNote,  status: 'soon' },
        { href: '/finance/assets',       label: 'Aset',              description: 'Properti, kendaraan, emas',       icon: Archive,        status: 'ready' },
      ]}
    />
  )
}
