import type { Metadata } from 'next'
import { BarChart3, PieChart, TrendingUp, LineChart } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Laporan — FAMS' }

export default function ReportsPage() {
  return (
    <PageSkeleton
      title="Laporan Keuangan"
      subtitle="Ringkasan bulanan, arus kas, dan rincian per kategori."
      status="planned"
      icon={BarChart3}
      description="Modul Laporan akan dibangun setelah modul inti stabil (v1.2). Termasuk: ringkasan bulanan, grafik tren, perbandingan kategori, dan ekspor PDF/CSV."
      items={[
        { href: '/finance/reports',      label: 'Ringkasan Bulanan',   description: 'Pemasukan vs pengeluaran',    icon: BarChart3, status: 'planned' },
        { href: '/finance/reports',      label: 'Arus Kas',            description: 'Aliran dana per akun',         icon: LineChart, status: 'planned' },
        { href: '/finance/reports',      label: 'Per Kategori',        description: 'Pengeluaran per kategori',     icon: PieChart,  status: 'planned' },
        { href: '/finance/reports',      label: 'Tren Tahunan',        description: 'Perbandingan bulan ke bulan', icon: TrendingUp, status: 'planned' },
      ]}
    />
  )
}
