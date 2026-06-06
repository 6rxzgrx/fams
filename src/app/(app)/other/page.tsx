import type { Metadata } from 'next'
import { Wrench, FileLock, StickyNote } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Lainnya — FAMS' }

export default function OtherPage() {
  return (
    <PageSkeleton
      variant="root"
      title="Lainnya"
      subtitle="Modul pendukung di luar keuangan & kalender."
      status="soon"
      description="Bagian ini menampung modul yang tidak terkait keuangan langsung — perawatan rumah, arsip dokumen, dan catatan keluarga."
      items={[
        { href: '/other/maintenance', label: 'Perawatan',       description: 'AC, kendaraan, peralatan rumah',          icon: Wrench,     color: '#0369A1', status: 'soon' },
        { href: '/other/vault',       label: 'Brankas Dokumen', description: 'KTP, paspor, asuransi, garansi',           icon: FileLock,   color: '#B42318', status: 'soon' },
        { href: '/other/notes',       label: 'Catatan',         description: 'Aturan rumah, password, perjanjian',       icon: StickyNote, color: '#CA8A04', status: 'soon' },
      ]}
    />
  )
}
