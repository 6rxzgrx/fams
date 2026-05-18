'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AppBarCrumb {
  href: string
  label: string
}

export interface AppBarProps {
  title: string
  crumbs?: AppBarCrumb[]
  backHref?: string
  action?: React.ReactNode
  className?: string
}

export function AppBar({ title, crumbs, backHref, action, className }: AppBarProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-2 border-b border-border bg-background',
        'h-14 px-4 lg:h-[52px] lg:px-10',
        'sticky top-0 z-30 lg:static',
        className,
      )}
    >
      {/* Mobile: optional back chevron + centered title */}
      <div className="flex flex-1 items-center gap-2 lg:hidden">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Kembali"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </Link>
        ) : null}
        <h1 className="flex-1 text-center text-[17px] font-semibold tracking-tight">
          {title}
        </h1>
        {action ? <div className="-mr-2">{action}</div> : <div className="size-11" />}
      </div>

      {/* Desktop: breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden flex-1 items-center gap-1.5 lg:flex">
        {crumbs && crumbs.length > 0 ? (
          crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <React.Fragment key={`${c.href}-${i}`}>
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {last ? (
                  <span aria-current="page" className="text-[14px] font-semibold text-foreground">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="text-[14px] text-muted-foreground hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                )}
              </React.Fragment>
            )
          })
        ) : (
          <span aria-current="page" className="text-[14px] font-semibold text-foreground">
            {title}
          </span>
        )}
      </nav>

      {action ? <div className="hidden lg:block">{action}</div> : null}
    </header>
  )
}
