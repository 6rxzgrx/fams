'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Tags, Briefcase, RefreshCw, History, ChevronDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  {
    href: '/settings/finance-setup/asset-log',
    label: 'Asset Log',
    description: 'Riwayat perubahan saldo aset',
    icon: History,
  },
  {
    href: '/settings/finance-setup/converter',
    label: 'Converter',
    description: 'Harga emas, kurs, dan aset lainnya',
    icon: RefreshCw,
  },
] as const

export function FinanceSetupNav() {
  const pathname = usePathname()
  const current = ITEMS.find((i) => i.href === pathname) ?? ITEMS[0]
  const CurrentIcon = current.icon

  return (
    <>
      {/* Mobile: single button → dropdown list of sections */}
      <div className="lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-muted"
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent">
                <CurrentIcon className="size-4" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{current.label}</span>
                <span className="block truncate text-[12px] text-muted-foreground">
                  {current.description}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[calc(100vw-2.5rem)] max-w-[420px]"
          >
            {ITEMS.map((item) => {
              const active = item.href === current.href
              const Icon = item.icon
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} aria-current={active ? 'page' : undefined} className="gap-3 py-2.5">
                    <span
                      className={cn(
                        'inline-flex size-8 shrink-0 items-center justify-center rounded-pill',
                        active ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground',
                      )}
                    >
                      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-accent" strokeWidth={2.5} aria-hidden="true" />}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
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
