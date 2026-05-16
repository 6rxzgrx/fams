import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page-container'

type SubItem = {
  href: string
  label: string
  description?: string
  icon?: LucideIcon
  status?: 'ready' | 'soon' | 'planned'
}

type Props = {
  title: string
  subtitle?: string
  status?: 'ready' | 'soon' | 'planned'
  icon?: LucideIcon
  description?: string
  items?: SubItem[]
  children?: React.ReactNode
}

const STATUS_LABEL: Record<NonNullable<Props['status']>, string> = {
  ready: 'Siap',
  soon: 'Segera',
  planned: 'Rencana',
}

const STATUS_TONE: Record<NonNullable<Props['status']>, string> = {
  ready: 'bg-success-soft text-success',
  soon: 'bg-warning-soft text-warning',
  planned: 'bg-muted text-muted-foreground',
}

export function PageSkeleton({
  title,
  subtitle,
  status,
  icon: Icon = Sparkles,
  description,
  items,
  children,
}: Props) {
  return (
    <PageContainer className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
            {title}
          </h1>
          {status && (
            <span
              className={cn(
                'inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-semibold',
                STATUS_TONE[status],
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground lg:text-sm">{subtitle}</p>
        )}
      </header>

      {description && (
        <section className="rounded-lg border border-border bg-surface p-5 lg:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent">
              <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
            </span>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </section>
      )}

      {items && items.length > 0 && (
        <section className="grid gap-2 lg:grid-cols-2 lg:gap-3">
          {items.map((item, idx) => (
            <Link
              key={`${item.href}-${idx}`}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 lg:p-5',
                'transition-colors hover:border-border-strong hover:bg-muted/40',
              )}
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-pill bg-muted text-foreground">
                {item.icon ? (
                  <item.icon className="size-5" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Sparkles className="size-5" strokeWidth={2} aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{item.label}</p>
                  {item.status && item.status !== 'ready' && (
                    <span
                      className={cn(
                        'inline-flex items-center rounded-pill px-2 py-0.5 text-[10px] font-semibold',
                        STATUS_TONE[item.status],
                      )}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
              <ArrowUpRight
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          ))}
        </section>
      )}

      {children}
    </PageContainer>
  )
}
