import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  className?: string
  /** Removes mobile px/py — useful when the page has a sticky header that needs to span full-bleed. */
  bleed?: boolean
}

/**
 * Standard page wrapper. Constrains content width and applies consistent
 * mobile/desktop padding across every page inside the (app) layout.
 */
export function PageContainer({ children, className, bleed = false }: Props) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-md lg:max-w-7xl',
        bleed ? 'lg:px-10 lg:py-8' : 'px-6 py-4 lg:px-10 lg:py-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
