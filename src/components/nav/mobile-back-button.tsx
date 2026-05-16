'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBackButtonProps {
  label?: string
  className?: string
}

export function MobileBackButton({ label = 'Kembali', className }: MobileBackButtonProps) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(
        'lg:hidden inline-flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground',
        'transition-colors hover:text-foreground active:opacity-70 -ml-1 mb-1',
        className,
      )}
    >
      <ChevronLeft className="size-4 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {label}
    </button>
  )
}
