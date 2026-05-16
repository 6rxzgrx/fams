import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft, SlidersHorizontal } from 'lucide-react'
import { PageContainer } from '@/components/layout/page-container'
import { FinanceSetupNav } from '@/components/settings/finance-setup-nav'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Finance Setup - FAMS' }

export default function FinanceSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer className="space-y-6 lg:max-w-[1200px]">
      <header className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="w-fit px-0">
          <Link href="/settings">
            <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden="true" />
            Kembali ke Pengaturan
          </Link>
        </Button>
        <div>
          <div className="mb-2 inline-flex size-11 items-center justify-center rounded-pill bg-accent-soft text-accent">
            <SlidersHorizontal className="size-5" strokeWidth={2.25} aria-hidden="true" />
          </div>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
            Finance Setup
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Area konfigurasi untuk kategori transaksi serta daftar akun dan aset keluarga.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <FinanceSetupNav />
        <div className="min-w-0">{children}</div>
      </div>
    </PageContainer>
  )
}
