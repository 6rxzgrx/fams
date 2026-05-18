'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/sections/empty-state'
import { PageContainer } from '@/components/layout/page-container'
import { MonthPicker } from '@/components/finance/month-picker'
import { MobileBackButton } from '@/components/nav/mobile-back-button'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function BillsPage() {
  const [month, setMonth] = useState(currentYM)

  return (
    <PageContainer bleed>
      <header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
        <div className="min-w-0">
          <MobileBackButton />
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
            Tagihan
          </h1>
          <p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
            Listrik, sewa, langganan, dan tagihan rutin keluarga.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Button variant="accent" disabled className="hidden lg:inline-flex">
            <Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
            Tambah Tagihan
          </Button>
        </div>
      </header>

      <EmptyState
        icon={FileText}
        title="Tagihan (Week 4)"
        description="Fitur ini akan tersedia di Week 4: Bills + Recurring."
      />
    </PageContainer>
  )
}
