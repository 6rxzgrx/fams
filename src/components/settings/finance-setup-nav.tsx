'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tags, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  {
    href: '/settings/finance-setup/categories',
    label: 'Kategori',
    description: 'Kategori transaksi dan anggaran',
    icon: Tags,
  },
  {
    href: '/settings/finance-setup/assets',
    label: 'Asset',
    description: 'Akun dan aset fisik keluarga',
    icon: Briefcase,
  },
] as const

export function FinanceSetupNav() {
  const pathname = usePathname()

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {ITEMS.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex min-w-max items-center gap-2 rounded-pill px-4 py-3 text-sm font-semibold transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'bg-surface text-foreground',
              )}
            >
              <Icon className="size-4" strokeWidth={active ? 2.25 : 1.9} aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </div>

      <aside className="hidden lg:block">
        <div className="rounded-xl border border-border bg-surface p-2">
          <div className="px-3 py-2">
            <p className="text-eyebrow text-muted-foreground">Finance Setup</p>
          </div>
          <nav aria-label="Navigasi Finance Setup" className="space-y-1">
            {ITEMS.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-muted',
                  )}
                >
                  <span className={cn(
                    'inline-flex size-9 items-center justify-center rounded-pill',
                    active ? 'bg-black/10' : 'bg-muted',
                  )}>
                    <Icon className="size-4" strokeWidth={active ? 2.25 : 1.9} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className={cn(
                      'block truncate text-[12px]',
                      active ? 'text-accent-foreground/70' : 'text-muted-foreground',
                    )}>
                      {item.description}
                    </span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
