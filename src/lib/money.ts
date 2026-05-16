// IDR has no decimal places; amount stored as integer (rupiah)
const IDR_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const COMPACT_FORMATTER = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  compactDisplay: 'short',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export function formatMoney(amount: number): string {
  return IDR_FORMATTER.format(amount)
}

export function formatMoneyCompact(amount: number): string {
  return `Rp ${COMPACT_FORMATTER.format(amount)}`
}

export function parseMoney(input: string): number {
  const cleaned = input.replace(/[^\d]/g, '')
  return parseInt(cleaned, 10) || 0
}

export function formatMoneyInput(amount: number): string {
  if (amount === 0) return ''
  return new Intl.NumberFormat('id-ID').format(amount)
}
