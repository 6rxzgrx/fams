import type { LucideIcon } from 'lucide-react'
import { CategoryIcon } from '@/components/finance/category-icon'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

const TILE: Record<Size, string> = {
  sm: 'size-8 rounded-[9px]',
  md: 'size-10 rounded-xl',
  lg: 'size-12 rounded-[14px]',
}

const GLYPH: Record<Size, string> = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

type Props = {
  /** Category icon key (see CATEGORY_ICON_MAP) — used when `icon` not given. */
  iconKey?: string
  /** A lucide icon component, takes precedence over `iconKey`. */
  icon?: LucideIcon
  /** Tint color (hex). Drives both glyph color and the soft background. Defaults to muted. */
  color?: string | null
  size?: Size
  className?: string
}

/**
 * The standard colored icon tile: a lucide glyph in its category color sitting
 * on a ~12%-alpha tint of the same color, with rounded corners. Used everywhere
 * a category or module icon appears (lists, cards, pickers) so the flat colored
 * look stays consistent and dark-mode safe.
 */
export function IconTile({ iconKey, icon: Icon, color, size = 'md', className }: Props) {
  const tint = color || undefined
  const style = tint
    ? { color: tint, backgroundColor: `color-mix(in srgb, ${tint} 14%, transparent)` }
    : undefined

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        TILE[size],
        !tint && 'bg-muted text-muted-foreground',
        className,
      )}
      style={style}
      aria-hidden="true"
    >
      {Icon ? (
        <Icon className={GLYPH[size]} strokeWidth={2} />
      ) : (
        <CategoryIcon icon={iconKey ?? 'tag'} className={GLYPH[size]} />
      )}
    </span>
  )
}
