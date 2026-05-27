'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  LogOut,
  ChevronRight,
  Palette,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

type SettingItem = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

const ITEMS: SettingItem[] = [
  {
    href: '/settings/finance-setup',
    label: 'Finance Setup',
    description: 'Kategori transaksi serta aset & akun',
    icon: SlidersHorizontal,
  },
  {
    href: '/settings/members',
    label: 'Anggota Keluarga',
    description: 'Kelola peran & akses modul',
    icon: Users,
  },
]

export default function SettingsPage() {
  const { data: session } = useSession()

  return (
    <PageContainer className="space-y-5 lg:space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
          Pengaturan
        </h1>
        <p className="hidden text-[13px] text-muted-foreground lg:block">
          Akun, anggota, integrasi, dan riwayat aktivitas keluarga.
        </p>
      </header>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Akun</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="h-12 w-12 rounded-full" />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-pill bg-accent text-accent-foreground text-lg font-bold">
                {session?.user?.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-danger border-danger/40 hover:bg-danger-soft hover:text-danger"
            onClick={() => signOut({ callbackUrl: '/sign-in' })}
          >
            <LogOut className="size-4" strokeWidth={2.25} aria-hidden="true" />
            Keluar
          </Button>
        </CardContent>
      </Card>

      {/* Sub-sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Kelola</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y divide-border">
            {ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 py-3 transition-colors',
                    'hover:text-foreground',
                  )}
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-muted text-foreground">
                    <item.icon className="size-4" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Palette className="size-4 text-primary" strokeWidth={2} aria-hidden="true" />
            Tampilan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Mode Warna</p>
              <p className="text-xs text-muted-foreground">Ikut sistem, atau pilih sendiri.</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* App info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Versi</span>
            <span className="tabular-nums font-semibold">0.1.0</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Status API</span>
            <a href="/api/health" className="text-primary text-xs font-semibold hover:underline">
              /api/health
            </a>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
