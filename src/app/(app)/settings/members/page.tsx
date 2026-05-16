import type { Metadata } from 'next'
import { Users } from 'lucide-react'
import { PageSkeleton } from '@/components/sections/page-skeleton'

export const metadata: Metadata = { title: 'Anggota Keluarga — FAMS' }

export default function MembersPage() {
  return (
    <PageSkeleton
      title="Anggota Keluarga"
      subtitle="Kelola anggota, peran, dan modul yang dapat diakses."
      status="soon"
      icon={Users}
      description="Halaman ini akan menampilkan daftar anggota keluarga (maks 8). Admin dapat menambah/mengubah peran (admin, pencatat, pengamat) dan menentukan modul yang terlihat untuk setiap anggota."
    />
  )
}
