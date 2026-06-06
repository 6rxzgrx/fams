'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/finance/category-icon'
import {
  BRAND_CATALOG,
  brandIconValue,
  iconBrandSlug,
  brandLogoPath,
} from '@/components/finance/brand-registry'
import { ASSET_ICON_OPTIONS, CATEGORY_COLOR_OPTIONS } from '@/domain/constants'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Current icon value — a lucide key or a `brand:<slug>` value. */
  icon: string
  color: string
  onIconChange: (icon: string) => void
  onColorChange: (color: string) => void
}

/**
 * The shared icon + color picker used wherever an asset/account/category icon is
 * chosen. Organised into sections (like the OS emoji picker): a bank/brand-logo
 * grid that pins a real logo (`brand:<slug>`), a tinted common-icon grid, and a
 * colour palette for the icon tiles. New sections can slot in over time.
 */
export function IconPicker({
  open,
  onOpenChange,
  icon,
  color,
  onIconChange,
  onColorChange,
}: Props) {
  const brandSlug = iconBrandSlug(icon)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm gap-0 p-0">
        <DialogHeader className="border-b border-border px-5 pb-4 pt-5">
          <DialogTitle className="text-[17px]">Ikon &amp; Warna</DialogTitle>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-5 overflow-y-auto px-5 py-5">
          {/* Live preview */}
          <div className="flex justify-center">
            <PreviewTile icon={icon} color={color} brandSlug={brandSlug} />
          </div>

          {/* Logo Bank / Brand */}
          <section className="space-y-2">
            <p className="text-eyebrow text-muted-foreground">Logo Bank &amp; E-Wallet</p>
            <div className="grid grid-cols-4 gap-2">
              {BRAND_CATALOG.map((brand) => {
                const selected = brandSlug === brand.slug
                return (
                  <button
                    key={brand.slug}
                    type="button"
                    onClick={() => onIconChange(brandIconValue(brand.slug))}
                    aria-label={brand.label}
                    title={brand.label}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-xl border bg-white p-2 transition-all',
                      selected
                        ? 'border-accent ring-2 ring-accent'
                        : 'border-border hover:border-border-strong',
                    )}
                  >
                    <Image
                      src={brandLogoPath(brand.slug)}
                      alt={brand.label}
                      width={40}
                      height={40}
                      unoptimized
                      className="size-full object-contain"
                    />
                  </button>
                )
              })}
            </div>
          </section>

          {/* Common icons (tinted by selected color) */}
          <section className="space-y-2">
            <p className="text-eyebrow text-muted-foreground">Ikon</p>
            <div className="grid grid-cols-7 gap-2">
              {ASSET_ICON_OPTIONS.map((key) => {
                const selected = !brandSlug && icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onIconChange(key)}
                    aria-label={key}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-xl border transition-all',
                      selected ? 'border-accent ring-2 ring-accent' : 'border-transparent hover:bg-muted',
                    )}
                    style={
                      selected
                        ? undefined
                        : { backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`, color }
                    }
                  >
                    <CategoryIcon
                      icon={key}
                      className={cn('size-[18px]', selected && 'text-accent')}
                    />
                  </button>
                )
              })}
            </div>
          </section>

          {/* Warna */}
          <section className="space-y-2">
            <p className="text-eyebrow text-muted-foreground">Warna</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onColorChange(c)}
                  aria-label={`Pilih warna ${c}`}
                  className="relative size-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" strokeWidth={3} aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewTile({
  icon,
  color,
  brandSlug,
}: {
  icon: string
  color: string
  brandSlug: string | null
}) {
  if (brandSlug) {
    return (
      <span className="flex size-16 items-center justify-center rounded-2xl border border-border bg-white p-2.5">
        <Image
          src={brandLogoPath(brandSlug)}
          alt="logo"
          width={56}
          height={56}
          unoptimized
          className="size-full object-contain"
        />
      </span>
    )
  }
  return (
    <span
      className="flex size-16 items-center justify-center rounded-2xl"
      style={{ backgroundColor: color }}
    >
      <CategoryIcon icon={icon} className="size-7 text-white drop-shadow-sm" />
    </span>
  )
}
