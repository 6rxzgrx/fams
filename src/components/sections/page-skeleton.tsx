import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { IconTile } from '@/components/finance/icon-tile'

type SubItem = {
  href: string
  label: string
  description?: string
  icon?: LucideIcon
  color?: string
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
  /** Header style — `root` (top-level) or `sub` (centered + back). Defaults to `sub`. */
  variant?: 'root' | 'sub'
  /** Back target for the `sub` header. */
  backHref?: string
  /** Desktop breadcrumb trail. */
  crumbs?: { href: string; label: string }[]
  /** `root` + mobile: show avatar + notification bell. */
  showAvatar?: boolean
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
  variant = 'sub',
  backHref,
  crumbs,
  showAvatar,
}: Props) {
  return (
    <>
      <PageHeader
        variant={variant}
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        crumbs={crumbs}
        showAvatar={showAvatar}
        action={
          status ? (
            <span
              className={cn(
                'inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-semibold',
                STATUS_TONE[status],
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          ) : undefined
        }
      />
      <PageContainer underHeader className="space-y-6">
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
              <IconTile icon={item.icon ?? Sparkles} color={item.color ?? '#6366F1'} size="md" />
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
    </>
  )
}
