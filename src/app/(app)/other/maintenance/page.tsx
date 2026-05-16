import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Perawatan — FAMS' }

export default function MaintenancePage() {
  return (
    <PageSkeleton
      title="Perawatan"
      subtitle="Jadwal servis AC, kendaraan, dan peralatan rumah."
      status="soon"
      icon={Wrench}
      description="Modul Perawatan melacak interval servis berkala (AC, mobil, motor, alat elektronik). Setiap entri menyimpan tanggal terakhir, interval, dan otomatis membuat pengingat menjelang jatuh tempo."
    />
  )
}
