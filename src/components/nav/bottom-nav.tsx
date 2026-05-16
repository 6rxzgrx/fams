'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutDashboard, Plus, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AddSheet } from './add-sheet'
import { ScanDialog } from './scan-dialog'
import { AddTransactionDialog } from './add-transaction-dialog'

const NAV_ITEMS = [
  { href: '/home',              label: 'Beranda',    icon: Home,            matchPrefix: false },
  { href: '/finance/dashboard', label: 'Keuangan',   icon: LayoutDashboard, matchPrefix: true  },
  { href: '/notifications',     label: 'Notifikasi', icon: Bell,            matchPrefix: false },
  { href: '/settings',          label: 'Pengaturan', icon: Settings,        matchPrefix: false },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

  // Render: [Home, Tx, FAB, Notif, Settings] — FAB sits in the middle.
  const left = NAV_ITEMS.slice(0, 2)
  const right = NAV_ITEMS.slice(2)

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-5 pb-safe lg:hidden"
      >
        <div
          className={cn(
            'pointer-events-auto mx-auto mb-4 flex h-16 max-w-md items-center justify-between',
            'rounded-pill border border-border-strong bg-surface-elevated/85 px-2',
            'shadow-md backdrop-blur-xl',
          )}
        >
          {left.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}

          {/* Center FAB */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            aria-label="Tambah cepat"
            className={cn(
              'relative -mt-6 inline-flex size-14 items-center justify-center rounded-pill',
              'bg-accent text-accent-foreground shadow-md',
              'transition-transform duration-150 ease-out active:scale-95',
              'ring-4 ring-background',
            )}
          >
            <Plus className="size-6" strokeWidth={2.5} aria-hidden="true" />
          </button>

          {right.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>

      <AddSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onScan={() => setScanOpen(true)}
        onManual={() => setManualOpen(true)}
      />
      <ScanDialog open={scanOpen} onOpenChange={setScanOpen} />
      <AddTransactionDialog open={manualOpen} onOpenChange={setManualOpen} />
    </>
  )
}

function NavItem({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: typeof Home; matchPrefix: boolean }
  pathname: string
}) {
  const { href, label, icon: Icon } = item
  const active = pathname === href || (item.matchPrefix && pathname.startsWith(href))
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex size-12 items-center justify-center rounded-pill',
        'transition-[background-color,color,transform] duration-200 ease-out',
        'active:scale-95',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon
        className="size-5"
        strokeWidth={active ? 2.5 : 1.75}
        aria-hidden="true"
      />
    </Link>
  )
}
