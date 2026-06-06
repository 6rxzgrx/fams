import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
  /** Removes mobile px/py — useful when the page has a sticky header that needs to span full-bleed. */
  bleed?: boolean
  /**
   * Use when a `PageHeader` sits directly above this body. The header owns the
   * top padding, so the body drops its own top padding and mobile px to avoid
   * a double gap. Side/bottom padding is kept.
   */
  underHeader?: boolean
}

/**
 * Standard page wrapper. Constrains content width and applies consistent
 * mobile/desktop padding across every page inside the (app) layout.
 *
 * Pair with `PageHeader` using `underHeader` so the header and body share one
 * spacing contract instead of each page hand-rolling px-5 / px-6 / bleed.
 */
export function PageContainer({ children, className, bleed = false, underHeader = false }: Props) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-md lg:max-w-7xl',
        underHeader
          ? 'px-5 pb-6 pt-4 lg:px-10 lg:pt-2 lg:pb-8'
          : bleed
            ? 'lg:px-10 lg:py-8'
            : 'px-6 py-4 lg:px-10 lg:py-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
