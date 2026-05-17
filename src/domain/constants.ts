import type { CategoryType } from './types'

export interface DefaultCategory {
  key: string
  name: string
  type: CategoryType
  icon: string
  color: string
  parent_key?: string
  budget_type?: string
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { key: 'expense-belanja', name: 'Belanja', type: 'expense', icon: 'shopping-bag', color: '#8b5cf6', budget_type: 'wants' },
  { key: 'expense-belanja-baju', name: 'Baju', type: 'expense', icon: 'tag', color: '#8b5cf6', parent_key: 'expense-belanja' },
  { key: 'expense-belanja-online', name: 'Belanja Online', type: 'expense', icon: 'tag', color: '#8b5cf6', parent_key: 'expense-belanja' },
  { key: 'expense-belanja-gadget', name: 'Gadget/Elektronik', type: 'expense', icon: 'tag', color: '#8b5cf6', parent_key: 'expense-belanja' },
  { key: 'expense-belanja-groceries', name: 'Groceries', type: 'expense', icon: 'tag', color: '#8b5cf6', parent_key: 'expense-belanja' },
  { key: 'expense-belanja-uncategorized', name: 'Belum Terkategori', type: 'expense', icon: 'tag', color: '#8b5cf6', parent_key: 'expense-belanja' },
  { key: 'expense-hiburan', name: 'Hiburan', type: 'expense', icon: 'tv', color: '#ec4899', budget_type: 'wants' },
  { key: 'expense-hutang-piutang', name: 'Hutang Piutang', type: 'expense', icon: 'wallet', color: '#f97316', budget_type: 'needs' },
  { key: 'expense-hutang-bayar', name: 'Bayar Hutang', type: 'expense', icon: 'tag', color: '#f97316', parent_key: 'expense-hutang-piutang' },
  { key: 'expense-hutang-pinjam', name: 'Beri Pinjaman', type: 'expense', icon: 'tag', color: '#f97316', parent_key: 'expense-hutang-piutang' },
  { key: 'expense-investasi', name: 'Investasi', type: 'expense', icon: 'bar-chart', color: '#06b6d4', budget_type: 'savings' },
  { key: 'expense-investasi-emas', name: 'Emas', type: 'expense', icon: 'tag', color: '#06b6d4', parent_key: 'expense-investasi' },
  { key: 'expense-investasi-reksadana', name: 'Reksadana', type: 'expense', icon: 'tag', color: '#06b6d4', parent_key: 'expense-investasi' },
  { key: 'expense-investasi-saham', name: 'Saham', type: 'expense', icon: 'tag', color: '#06b6d4', parent_key: 'expense-investasi' },
  { key: 'expense-investasi-tabungan', name: 'Tabungan', type: 'expense', icon: 'tag', color: '#06b6d4', parent_key: 'expense-investasi' },
  { key: 'expense-keluarga', name: 'Keluarga', type: 'expense', icon: 'home', color: '#10b981', budget_type: 'wants' },
  { key: 'expense-kesehatan', name: 'Kesehatan', type: 'expense', icon: 'heart', color: '#ef4444', budget_type: 'needs' },
  { key: 'expense-lain', name: 'Lain-lain', type: 'expense', icon: 'more-horizontal', color: '#64748b', budget_type: 'wants' },
  { key: 'expense-makan', name: 'Makan dan Minum', type: 'expense', icon: 'utensils', color: '#f59e0b', budget_type: 'needs' },
  { key: 'expense-makan-jajan', name: 'Jajan', type: 'expense', icon: 'tag', color: '#f59e0b', parent_key: 'expense-makan' },
  { key: 'expense-makan-delivery', name: 'Online Delivery', type: 'expense', icon: 'tag', color: '#f59e0b', parent_key: 'expense-makan' },
  { key: 'expense-makan-restoran', name: 'Restoran', type: 'expense', icon: 'tag', color: '#f59e0b', parent_key: 'expense-makan' },
  { key: 'expense-pekerjaan', name: 'Pekerjaan', type: 'expense', icon: 'briefcase', color: '#0ea5e9', budget_type: 'needs' },
  { key: 'expense-pendidikan', name: 'Pendidikan', type: 'expense', icon: 'book', color: '#3b82f6', budget_type: 'needs' },
  { key: 'expense-pinjaman', name: 'Pinjaman', type: 'expense', icon: 'wallet', color: '#fb7185', budget_type: 'needs' },
  { key: 'expense-pinjaman-mobil', name: 'Cicilan Mobil', type: 'expense', icon: 'tag', color: '#fb7185', parent_key: 'expense-pinjaman' },
  { key: 'expense-pinjaman-rumah', name: 'Cicilan Rumah', type: 'expense', icon: 'tag', color: '#fb7185', parent_key: 'expense-pinjaman' },
  { key: 'expense-pinjaman-hutang', name: 'Hutang', type: 'expense', icon: 'tag', color: '#fb7185', parent_key: 'expense-pinjaman' },
  { key: 'expense-sedekah', name: 'Sedekah', type: 'expense', icon: 'gift', color: '#22c55e', budget_type: 'sedekah' },
  { key: 'expense-sedekah-infaq', name: 'Infaq', type: 'expense', icon: 'tag', color: '#22c55e', parent_key: 'expense-sedekah' },
  { key: 'expense-sedekah-sumbangan', name: 'Sumbangan', type: 'expense', icon: 'tag', color: '#22c55e', parent_key: 'expense-sedekah' },
  { key: 'expense-sedekah-zakat', name: 'Zakat', type: 'expense', icon: 'tag', color: '#22c55e', parent_key: 'expense-sedekah' },
  { key: 'expense-tagihan', name: 'Tagihan', type: 'expense', icon: 'zap', color: '#eab308', budget_type: 'needs' },
  { key: 'expense-tagihan-air', name: 'Air', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-tagihan-gas', name: 'Gas', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-tagihan-internet', name: 'Internet', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-tagihan-cc', name: 'Kartu Kredit', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-tagihan-listrik', name: 'Listrik', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-tagihan-pulsa', name: 'Pulsa dan Paket Data', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-tagihan-tv', name: 'TV Kabel', type: 'expense', icon: 'tag', color: '#eab308', parent_key: 'expense-tagihan' },
  { key: 'expense-transportasi', name: 'Transportasi', type: 'expense', icon: 'car', color: '#14b8a6', budget_type: 'needs' },
  { key: 'expense-transportasi-bensin', name: 'Bensin', type: 'expense', icon: 'tag', color: '#14b8a6', parent_key: 'expense-transportasi' },
  { key: 'expense-transportasi-parkir', name: 'Parkir', type: 'expense', icon: 'tag', color: '#14b8a6', parent_key: 'expense-transportasi' },
  { key: 'expense-transportasi-taxi', name: 'Taxi/Ojol', type: 'expense', icon: 'tag', color: '#14b8a6', parent_key: 'expense-transportasi' },

  { key: 'income-uncategorized', name: 'Belum Terkategori', type: 'income', icon: 'tag', color: '#64748b' },
  { key: 'income-bisnis', name: 'Bisnis', type: 'income', icon: 'trending-up', color: '#0ea5e9' },
  { key: 'income-bonus', name: 'Bonus', type: 'income', icon: 'gift', color: '#f59e0b' },
  { key: 'income-gaji', name: 'Gaji', type: 'income', icon: 'briefcase', color: '#059669' },
  { key: 'income-hutang-piutang', name: 'Hutang Piutang', type: 'income', icon: 'wallet', color: '#f97316' },
  { key: 'income-hutang-pinjam', name: 'Pinjam Uang', type: 'income', icon: 'tag', color: '#f97316', parent_key: 'income-hutang-piutang' },
  { key: 'income-hutang-piutang-dibayar', name: 'Piutang Dibayar', type: 'income', icon: 'tag', color: '#f97316', parent_key: 'income-hutang-piutang' },
  { key: 'income-investasi', name: 'Investasi', type: 'income', icon: 'bar-chart', color: '#06b6d4' },
  { key: 'income-lain', name: 'Lain-lain', type: 'income', icon: 'more-horizontal', color: '#64748b' },
  { key: 'income-pemberian', name: 'Pemberian', type: 'income', icon: 'gift', color: '#22c55e' },
  { key: 'income-penjualan', name: 'Penjualan', type: 'income', icon: 'shopping-bag', color: '#8b5cf6' },
  { key: 'income-pinjaman', name: 'Pinjaman', type: 'income', icon: 'wallet', color: '#fb7185' },

  { key: 'transfer-transfer', name: 'Transfer', type: 'transfer', icon: 'arrow-left-right', color: '#94a3b8' },
  { key: 'transfer-topup', name: 'Top UP', type: 'transfer', icon: 'arrow-left-right', color: '#94a3b8' },
  { key: 'transfer-cashout', name: 'Tarik Tunai', type: 'transfer', icon: 'arrow-left-right', color: '#94a3b8' },
]

export const CATEGORY_ICON_OPTIONS = [
  'arrow-left-right',
  'bar-chart',
  'book',
  'briefcase',
  'car',
  'gift',
  'heart',
  'home',
  'more-horizontal',
  'shopping-bag',
  'tag',
  'trending-up',
  'tv',
  'utensils',
  'wallet',
  'zap',
] as const

export const CATEGORY_COLOR_OPTIONS = [
  '#059669',
  '#06b6d4',
  '#0ea5e9',
  '#14b8a6',
  '#22c55e',
  '#3b82f6',
  '#ef4444',
  '#f59e0b',
  '#f97316',
  '#eab308',
  '#ec4899',
  '#8b5cf6',
  '#94a3b8',
  '#64748b',
  '#fb7185',
] as const

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  cash: 'Tunai',
  bank: 'Bank',
  ewallet: 'Dompet Digital',
  loan: 'Pinjaman',
  investment: 'Investasi',
  prepaid_card: 'Kartu Prabayar',
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  investment: 'Investasi',
  precious_metal: 'Logam Mulia',
  stocks: 'Saham',
  crypto: 'Kripto',
  real_asset: 'Aset Nyata',
  business: 'Bisnis',
}

// Liquid account types shown in the Aset > Likuid tab
export const LIQUID_ACCOUNT_TYPES = ['bank', 'ewallet', 'prepaid_card', 'cash'] as const

// Non-liquid asset types shown in the Aset > Non-Likuid tab
export const NON_LIQUID_ASSET_TYPES = ['investment', 'precious_metal', 'stocks', 'crypto', 'real_asset', 'business'] as const

export const ASSET_TYPE_ICONS: Record<string, string> = {
  bank: 'landmark',
  ewallet: 'smartphone',
  prepaid_card: 'credit-card',
  cash: 'coins',
  investment: 'bar-chart',
  precious_metal: 'gem',
  stocks: 'trending-up',
  crypto: 'bitcoin',
  real_asset: 'home',
  business: 'briefcase',
}

export const ASSET_TYPE_COLORS: Record<string, string> = {
  bank: '#1e40af',
  ewallet: '#7c3aed',
  prepaid_card: '#0891b2',
  cash: '#059669',
  investment: '#06b6d4',
  precious_metal: '#ca8a04',
  stocks: '#0ea5e9',
  crypto: '#f97316',
  real_asset: '#10b981',
  business: '#8b5cf6',
}

export const ACCOUNT_ICON_OPTIONS = ['wallet', 'banknote', 'credit-card', 'piggy-bank', 'landmark', 'smartphone', 'coins', 'building-2'] as const
export const ACCOUNT_COLOR_OPTIONS = ['#059669', '#1e40af', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#ca8a04', '#0891b2'] as const

import type { BudgetType } from './types'

export const BUDGET_TYPES: BudgetType[] = ['needs', 'savings', 'wants', 'sedekah']

export const BUDGET_TYPE_LABELS: Record<BudgetType, string> = {
  needs: 'Kebutuhan',
  savings: 'Tabungan & Investasi',
  wants: 'Keinginan',
  sedekah: 'Sedekah',
}

export const BUDGET_TYPE_COLORS: Record<BudgetType, string> = {
  needs: '#3b82f6',
  savings: '#06b6d4',
  wants: '#ec4899',
  sedekah: '#22c55e',
}
