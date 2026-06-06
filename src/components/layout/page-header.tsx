'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PageHeaderCrumb {
  href: string
  label: string
}

export interface PageHeaderProps {
  /** `root` = top-level page (left title, optional avatar + bell). `sub` = detail/edit (centered title + back). */
  variant?: 'root' | 'sub'
  title: string
  /** Muted line under the title. Desktop always; mobile only on `root`. */
  subtitle?: string
  /** Desktop breadcrumb trail. Falls back to `[{label: title}]`. */
  crumbs?: PageHeaderCrumb[]
  /** `sub` variant back target. If omitted, uses `router.back()`. */
  backHref?: string
  /** Right-side slot — Add button, etc. (desktop right cluster + mobile header right). */
  action?: React.ReactNode
  /**
   * Mobile-only month bar. Rendered full-width directly below the header on
   * screens < lg. Pass a `<MonthPicker … fullWidth />`. On desktop, keep the
   * month picker inside `action` instead (the desktop right cluster).
   */
  monthPicker?: React.ReactNode
  /** `root` + mobile only: show the notification bell on the right. */
  showAvatar?: boolean
  /** Notification bell href (root + showAvatar). */
  bellHref?: string
  className?: string
}

/**
 * The single page header used across the whole (app) shell.
 *
 * Mobile:
 *   - root → left-aligned big title; optional avatar (left) + bell (right). Not sticky.
 *   - sub  → sticky bar: back chevron · centered title · action/spacer.
 * Desktop (both): breadcrumb + title row with action on the right. Never sticky.
 *
 * Pages MUST use this instead of rolling their own header so title placement
 * stays identical on every device.
 */
export function PageHeader({
  variant = 'root',
  title,
  subtitle,
  crumbs,
  backHref,
  action,
  monthPicker,
  showAvatar = false,
  bellHref = '/notifications',
  className,
}: PageHeaderProps) {
  const trail = crumbs && crumbs.length > 0 ? crumbs : [{ href: '#', label: title }]

  return (
    <header className={cn('w-full', className)}>
      {/* ── Mobile ─────────────────────────────────────────────── */}
      {variant === 'sub' ? (
        <MobileSubBar title={title} backHref={backHref} action={action} />
      ) : (
        <div className="flex items-end justify-between gap-3 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] lg:hidden">
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {showAvatar && (
              <Link
                href={bellHref}
                aria-label="Notifikasi"
                className="inline-flex size-10 items-center justify-center rounded-pill border border-border bg-surface text-foreground transition-colors hover:bg-muted active:scale-95"
              >
                <Bell className="size-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Mobile full-width month bar — sits directly under the header on every device size < lg */}
      {monthPicker && (
        <div className="border-y border-border bg-surface px-3 py-1 lg:hidden">{monthPicker}</div>
      )}

      {/* ── Desktop ────────────────────────────────────────────── */}
      <div className="hidden items-end justify-between gap-4 px-10 pt-8 pb-6 lg:flex">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
            {trail.map((c, i) => {
              const last = i === trail.length - 1
              return (
                <React.Fragment key={`${c.href}-${i}`}>
                  {i > 0 && <span className="text-[13px] text-muted-foreground">/</span>}
                  {last || c.href === '#' ? (
                    <span className="text-[13px] font-medium text-muted-foreground">{c.label}</span>
                  ) : (
                    <Link
                      href={c.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {c.label}
                    </Link>
                  )}
                </React.Fragment>
              )
            })}
          </nav>
          <h1 className="mt-1 truncate text-[28px] font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-[14px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </header>
  )
}

function MobileSubBar({
  title,
  backHref,
  action,
}: {
  title: string
  backHref?: string
  action?: React.ReactNode
}) {
  const router = useRouter()

  const backButton = backHref ? (
    <Link
      href={backHref}
      aria-label="Kembali"
      className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
    >
      <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Kembali"
      className="-ml-2 inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
    >
      <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
    </button>
  )

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
      <div className="flex h-14 items-center gap-2 px-3">
        {backButton}
        <h1 className="flex-1 truncate text-center text-[17px] font-semibold tracking-tight">
          {title}
        </h1>
        <div className="flex min-w-11 items-center justify-end">{action}</div>
      </div>
    </div>
  )
}
