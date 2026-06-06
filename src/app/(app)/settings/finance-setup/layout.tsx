import type { Metadata } from 'next'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { FinanceSetupNav } from '@/components/settings/finance-setup-nav'

export const metadata: Metadata = { title: 'Finance Setup - FAMS' }

export default function FinanceSetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader
        variant="sub"
        title="Finance Setup"
        subtitle="Konfigurasi kategori transaksi serta daftar akun dan aset keluarga."
        backHref="/settings"
        crumbs={[
          { href: '/settings', label: 'Pengaturan' },
          { href: '/settings/finance-setup', label: 'Finance Setup' },
        ]}
      />
      <PageContainer underHeader className="space-y-5 lg:max-w-[1200px] lg:space-y-6">
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <FinanceSetupNav />
          <div className="min-w-0">{children}</div>
        </div>
      </PageContainer>
    </>
  )
}
