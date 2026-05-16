'use client'

import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/sections/empty-state'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'

export default function BillsPage() {
  return (
    <PageContainer bleed>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-center justify-between px-5 py-4 lg:px-0 lg:py-0 lg:pb-8">
          <div>
            <MobileBackButton />
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">Tagihan</h1>
            <p className="hidden text-[13px] text-muted-foreground lg:block">
              Listrik, sewa, langganan, dan tagihan rutin keluarga.
            </p>
          </div>
          <Button
            variant="accent"
            size="icon"
            aria-label="Tambah tagihan"
            disabled
            className="rounded-pill lg:hidden"
          >
            <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
          </Button>
          <Button variant="accent" disabled className="hidden lg:inline-flex">
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            Tambah Tagihan
          </Button>
        </div>
      </header>

      {/* Content */}
      <EmptyState
        icon={FileText}
        title="Tagihan (Week 4)"
        description="Fitur ini akan tersedia di Week 4: Bills + Recurring."
      />
    </PageContainer>
  )
}
