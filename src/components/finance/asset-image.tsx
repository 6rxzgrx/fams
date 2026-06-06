'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { AssetType } from '@/domain/types'
import { IconTile } from '@/components/finance/icon-tile'
import {
  ASSET_TYPE_COLOR,
  ASSET_TYPE_ICON,
  resolveBrandLogo,
  iconBrandSlug,
  brandLogoPath,
} from '@/components/finance/brand-registry'

type Size = 'sm' | 'md' | 'lg'

const TILE: Record<Size, string> = {
  sm: 'size-8 rounded-[9px] p-1',
  md: 'size-10 rounded-xl p-1.5',
  lg: 'size-12 rounded-[14px] p-2',
}

const ICON_SIZE: Record<Size, Size> = { sm: 'sm', md: 'md', lg: 'lg' }
const PX: Record<Size, number> = { sm: 32, md: 40, lg: 48 }

type Props = {
  /** Asset/account type — drives the fallback icon + color. */
  type: AssetType
  /** Institution name (asset.bank_name preferred, then asset.name). */
  bankName?: string | null
  name?: string | null
  /**
   * The stored `icon` value. A `brand:<slug>` value pins that exact logo; a
   * plain lucide key means the user chose a custom glyph (skip auto logo).
   */
  icon?: string | null
  /** Explicit tint override for the fallback tile. */
  color?: string | null
  size?: Size
  className?: string
}

/**
 * The visual for an account/asset. Resolution order:
 *  1. an explicitly pinned brand logo (`icon = "brand:<slug>"`)
 *  2. a logo auto-detected from the institution name (BRI, BCA, GoPay, …)
 *  3. the user's chosen lucide glyph (`icon`) on a colored tile
 *  4. the asset-type fallback icon + color
 */
export function AssetImage({ type, bankName, name, icon, color, size = 'md', className }: Props) {
  const [errored, setErrored] = React.useState(false)

  const pinnedSlug = iconBrandSlug(icon)
  const hasCustomGlyph = !!icon && !pinnedSlug
  const logo = pinnedSlug
    ? brandLogoPath(pinnedSlug)
    : resolveBrandLogo(bankName) ?? resolveBrandLogo(name)

  if (logo && !errored) {
    const px = PX[size]
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center border border-border bg-white',
          TILE[size],
          className,
        )}
      >
        <Image
          src={logo}
          alt={bankName || name || 'logo'}
          width={px}
          height={px}
          unoptimized
          className="size-full object-contain"
          onError={() => setErrored(true)}
        />
      </span>
    )
  }

  const tint = color || ASSET_TYPE_COLOR[type] || ASSET_TYPE_COLOR.cash
  // Custom glyph wins; otherwise the asset-type default icon.
  if (hasCustomGlyph) {
    return <IconTile iconKey={icon as string} color={tint} size={ICON_SIZE[size]} className={className} />
  }
  const Icon = ASSET_TYPE_ICON[type] ?? ASSET_TYPE_ICON.cash
  return <IconTile icon={Icon} color={tint} size={ICON_SIZE[size]} className={className} />
}
