import {
  Banknote,
  Bitcoin,
  Briefcase,
  CreditCard,
  Gem,
  Home,
  Landmark,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AssetType } from '@/domain/types'

/**
 * Maps an institution name (asset.bank_name / asset.name) to a bundled logo
 * slug in `public/brands/<slug>.svg`. Logos sourced from idn-finlogos
 * (github.com/hafidznoor/idn-finlogos). Add a new entry here AND drop the SVG
 * into public/brands/ to extend coverage.
 *
 * Keys are normalized (lowercase, alphanumeric only) — see `normalize()`.
 */
const BRAND_SLUGS: Record<string, string> = {
  // Banks
  bca: 'bca',
  bankbca: 'bca',
  mandiri: 'mandiri',
  bankmandiri: 'mandiri',
  bri: 'bri',
  bankbri: 'bri',
  bankrakyatindonesia: 'bri',
  bni: 'bni',
  bankbni: 'bni',
  banknegaraindonesia: 'bni',
  bsi: 'bsi',
  banksyariahindonesia: 'bsi',
  btn: 'btn',
  banktabungannegara: 'btn',
  cimb: 'cimb-niaga',
  cimbniaga: 'cimb-niaga',
  permata: 'permata',
  bankpermata: 'permata',
  danamon: 'danamon',
  bankdanamon: 'danamon',
  jenius: 'jenius',
  jago: 'jago',
  bankjago: 'jago',
  seabank: 'seabank',
  blu: 'blu-bca',
  blubca: 'blu-bca',
  // E-wallets
  gopay: 'gopay',
  ovo: 'ovo-new',
  dana: 'dana',
  shopeepay: 'shopee-pay',
  shopee: 'shopee-pay',
  linkaja: 'linkaja',
  // Misc finance
  qris: 'qris',
  bankindonesia: 'bank-indonesia',
  bi: 'bank-indonesia',
}

/** Fallback lucide icon per asset type, used when no brand logo matches. */
export const ASSET_TYPE_ICON: Record<AssetType, LucideIcon> = {
  cash: Banknote,
  bank: Landmark,
  ewallet: Wallet,
  loan: CreditCard,
  prepaid_card: CreditCard,
  investment: TrendingUp,
  precious_metal: Gem,
  stocks: TrendingUp,
  crypto: Bitcoin,
  real_asset: Home,
  business: Briefcase,
}

/** Default tint color per asset type (used by the icon-tile fallback). */
export const ASSET_TYPE_COLOR: Record<AssetType, string> = {
  cash: '#0F8A6B',
  bank: '#1D4ED8',
  ewallet: '#7C3AED',
  loan: '#B42318',
  prepaid_card: '#A66400',
  investment: '#0F8A6B',
  precious_metal: '#CA8A04',
  stocks: '#0F8A6B',
  crypto: '#EA580C',
  real_asset: '#0369A1',
  business: '#475569',
}

/**
 * Curated, de-duplicated brand catalog shown in the icon picker (logo section).
 * One entry per real logo slug. Order = how they appear in the grid.
 */
export const BRAND_CATALOG: { slug: string; label: string }[] = [
  // Banks
  { slug: 'bca', label: 'BCA' },
  { slug: 'mandiri', label: 'Mandiri' },
  { slug: 'bri', label: 'BRI' },
  { slug: 'bni', label: 'BNI' },
  { slug: 'bsi', label: 'BSI' },
  { slug: 'btn', label: 'BTN' },
  { slug: 'cimb-niaga', label: 'CIMB Niaga' },
  { slug: 'permata', label: 'Permata' },
  { slug: 'danamon', label: 'Danamon' },
  { slug: 'jenius', label: 'Jenius' },
  { slug: 'jago', label: 'Jago' },
  { slug: 'seabank', label: 'SeaBank' },
  { slug: 'blu-bca', label: 'blu' },
  // E-wallets
  { slug: 'gopay', label: 'GoPay' },
  { slug: 'ovo-new', label: 'OVO' },
  { slug: 'dana', label: 'DANA' },
  { slug: 'shopee-pay', label: 'ShopeePay' },
  { slug: 'linkaja', label: 'LinkAja' },
  // Misc
  { slug: 'qris', label: 'QRIS' },
  { slug: 'bank-indonesia', label: 'Bank Indonesia' },
]

const BRAND_ICON_PREFIX = 'brand:'

/** Build the `icon` field value that pins a specific brand logo. */
export function brandIconValue(slug: string): string {
  return `${BRAND_ICON_PREFIX}${slug}`
}

/** If an `icon` value pins a brand logo, return its slug; else null. */
export function iconBrandSlug(icon: string | undefined | null): string | null {
  if (!icon || !icon.startsWith(BRAND_ICON_PREFIX)) return null
  return icon.slice(BRAND_ICON_PREFIX.length)
}

/** Public path to a bundled brand SVG by slug. */
export function brandLogoPath(slug: string): string {
  return `/brands/${slug}.svg`
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * Resolve a bundled logo path for an institution name, or null if none matches.
 * Tries the full normalized string, then progressively shorter prefixes so
 * "BCA Tabungan" still resolves to bca.
 */
export function resolveBrandLogo(name: string | undefined | null): string | null {
  if (!name) return null
  const norm = normalize(name)
  if (!norm) return null
  if (BRAND_SLUGS[norm]) return `/brands/${BRAND_SLUGS[norm]}.svg`

  // Try matching any known key as a substring (e.g. "rekening bca utama").
  for (const key of Object.keys(BRAND_SLUGS)) {
    if (key.length >= 3 && norm.includes(key)) return `/brands/${BRAND_SLUGS[key]}.svg`
  }
  return null
}
