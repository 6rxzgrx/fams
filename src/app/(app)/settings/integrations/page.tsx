import type { Metadata } from 'next'
import { Plug } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Integrasi — FAMS' }

export default function IntegrationsPage() {
  return (
    <PageSkeleton
      title="Integrasi"
      subtitle="Hubungkan Google OAuth, Drive, Calendar, dan Gemini AI."
      status="soon"
      icon={Plug}
      description="Halaman ini akan menampilkan status koneksi tiap integrasi (Google Sign-In, Sheets, Drive, Calendar, Gemini API), pemakaian kuota, dan opsi untuk menyambung ulang atau menukar penyedia AI."
    />
  )
}
