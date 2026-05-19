import { z } from 'zod'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RoleSchema = z.enum(['admin', 'editor', 'viewer'])
export type Role = z.infer<typeof RoleSchema>

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer', 'adjustment', 'refund'])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const AssetKindSchema = z.enum(['liquid', 'non_liquid'])
export type AssetKind = z.infer<typeof AssetKindSchema>

export const AssetTypeSchema = z.enum([
  'cash', 'bank', 'ewallet', 'loan', 'prepaid_card',
  'investment', 'precious_metal', 'stocks', 'crypto', 'real_asset', 'business',
])
export type AssetType = z.infer<typeof AssetTypeSchema>

export const CategoryTypeSchema = z.enum(['income', 'expense', 'transfer'])
export type CategoryType = z.infer<typeof CategoryTypeSchema>

export const BudgetTypeSchema = z.enum(['needs', 'savings', 'wants', 'sedekah'])
export type BudgetType = z.infer<typeof BudgetTypeSchema>

// ─── Family Member ────────────────────────────────────────────────────────────

export const FamilyMemberSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: RoleSchema,
  avatar_url: z.string().optional().default(''),
  module_access: z.string().default('{}'),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type FamilyMember = z.infer<typeof FamilyMemberSchema>

// ─── Asset (unified — replaces former Account + Asset) ───────────────────────

export const AssetSchema = z.object({
  id: z.string(),
  kind: AssetKindSchema,
  name: z.string(),
  type: AssetTypeSchema.catch('real_asset'),
  currency: z.string().default('IDR'),
  current_balance: z.string().default('0'),
  satuan: z.string().default('rupiah'),
  price_symbol: z.string().optional().default(''),
  bank_name: z.string().optional().default(''),
  account_number: z.string().optional().default(''),
  color: z.string().optional().default('#64748b'),
  icon: z.string().optional().default('wallet'),
  notes: z.string().optional().default(''),
  include_in_saldo: z.string().optional().default('true'),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type Asset = z.infer<typeof AssetSchema>

// Backward-compat alias — liquid assets are still called "accounts" in existing callers
export type Account = Asset

export const CreateAssetSchema = z.object({
  kind: AssetKindSchema,
  name: z.string().min(1, 'Nama aset wajib diisi').max(100),
  type: AssetTypeSchema,
  currency: z.string().default('IDR'),
  current_balance: z.number().nonnegative('Nilai tidak boleh negatif').default(0),
  satuan: z.string().default('rupiah'),
  price_symbol: z.string().default(''),
  bank_name: z.string().max(100).default(''),
  account_number: z.string().max(100).default(''),
  color: z.string().default('#64748b'),
  icon: z.string().default('wallet'),
  notes: z.string().max(500).default(''),
  include_in_saldo: z.boolean().default(true),
})

export type CreateAssetInput = z.infer<typeof CreateAssetSchema>

// Backward-compat alias
export type CreateAccountInput = CreateAssetInput

export const UpdateAssetSchema = CreateAssetSchema.omit({ kind: true }).partial()
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>

// Backward-compat alias
export type UpdateAccountInput = UpdateAssetInput

// ─── Transaction Category ─────────────────────────────────────────────────────

export const TransactionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: CategoryTypeSchema,
  icon: z.string().optional().default('tag'),
  color: z.string().optional().default('#64748b'),
  parent_id: z.string().optional().default(''),
  budget_type: z.string().optional().default(''),
  is_system: z.string().default('true'),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type TransactionCategory = z.infer<typeof TransactionCategorySchema>

export const CreateTransactionCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi').max(100),
  type: CategoryTypeSchema,
  icon: z.string().max(50).default('tag'),
  color: z.string().max(30).default('#64748b'),
  parent_id: z.string().default(''),
  budget_type: z.string().default(''),
})

export type CreateTransactionCategoryInput = z.infer<typeof CreateTransactionCategorySchema>

export const UpdateTransactionCategorySchema = CreateTransactionCategorySchema.partial()
export type UpdateTransactionCategoryInput = z.infer<typeof UpdateTransactionCategorySchema>

// ─── Transaction ──────────────────────────────────────────────────────────────

export const TransactionSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  category_id: z.string().optional().default(''),
  type: TransactionTypeSchema,
  amount: z.string(), // stored as string integer in Sheets
  description: z.string(),
  date: z.string(), // YYYY-MM-DD
  reference_no: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type Transaction = z.infer<typeof TransactionSchema>

// ─── Create/Update DTOs ───────────────────────────────────────────────────────

export const CreateTransactionSchema = z.object({
  account_id: z.string().min(1, 'Pilih akun'),
  category_id: z.string().min(1, 'Pilih kategori'),
  type: TransactionTypeSchema,
  amount: z.number().int().positive('Jumlah harus lebih dari 0'),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  reference_no: z.string().max(100).default(''),
  notes: z.string().max(500).default(''),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>

export const UpdateTransactionSchema = CreateTransactionSchema.partial()
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>

export const CreateTransferSchema = z.object({
  from_account_id: z.string().min(1, 'Pilih akun sumber'),
  to_account_id: z.string().min(1, 'Pilih akun tujuan'),
  category_id: z.string().min(1, 'Pilih kategori transfer'),
  amount: z.number().int().positive('Jumlah harus lebih dari 0'),
  description: z.string().min(1, 'Deskripsi wajib diisi').max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  notes: z.string().max(500).default(''),
}).refine((d) => d.from_account_id !== d.to_account_id, {
  message: 'Akun sumber dan tujuan harus berbeda',
  path: ['to_account_id'],
})

export type CreateTransferInput = z.infer<typeof CreateTransferSchema>

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const AuditLogSchema = z.object({
  id: z.string(),
  member_id: z.string(),
  member_name: z.string(),
  action: z.enum(['create', 'update', 'delete']),
  entity_type: z.string(),
  entity_id: z.string(),
  before_data: z.string().optional().default(''),
  after_data: z.string().optional().default(''),
  created_at: z.string(),
})

export type AuditLog = z.infer<typeof AuditLogSchema>

// ─── Reminder ─────────────────────────────────────────────────────────────────

export const RecurrenceSchema = z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly'])
export type Recurrence = z.infer<typeof RecurrenceSchema>

export const ReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(''),
  due_at: z.string(),
  recurrence: RecurrenceSchema.default('none'),
  calendar_event_id: z.string().optional().default(''),
  is_done: z.string().default('false'),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type Reminder = z.infer<typeof ReminderSchema>

export const CreateReminderSchema = z.object({
  title: z.string().min(1, 'Judul wajib diisi').max(200),
  description: z.string().max(500).default(''),
  due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Format waktu tidak valid (contoh: 2025-12-31T09:00)'),
  recurrence: RecurrenceSchema.default('none'),
  push_to_calendar: z.boolean().default(true),
})

export type CreateReminderInput = z.infer<typeof CreateReminderSchema>

export const UpdateReminderSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  due_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  recurrence: RecurrenceSchema.optional(),
  is_done: z.boolean().optional(),
  push_to_calendar: z.boolean().default(true),
})

export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>

// ─── Budget ───────────────────────────────────────────────────────────────────

export const BudgetSchema = z.object({
  id: z.string(),
  month: z.string(), // YYYY-MM
  category_id: z.string().optional().default(''), // empty = total or type-level budget
  budget_type: z.string().optional().default(''), // empty = total; needs/savings/wants/sedekah = type allocation
  allocated_amount: z.string().default('0'), // IDR for total; percentage (0-100) for type/category allocations
  notes: z.string().optional().default(''),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type Budget = z.infer<typeof BudgetSchema>

export const CreateBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format bulan tidak valid (YYYY-MM)'),
  category_id: z.string().default(''),
  budget_type: z.string().default(''),
  allocated_amount: z.number().int().nonnegative('Anggaran tidak boleh negatif'),
  notes: z.string().max(500).default(''),
})

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>

export const UpdateBudgetSchema = CreateBudgetSchema.partial()
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>

// ─── Calendar Sync Map ────────────────────────────────────────────────────────

export const CalendarSyncMapSchema = z.object({
  id: z.string(),
  entity_type: z.string(),
  entity_id: z.string(),
  calendar_event_id: z.string(),
  created_at: z.string(),
})

export type CalendarSyncMap = z.infer<typeof CalendarSyncMapSchema>

// ─── Asset Snapshot ───────────────────────────────────────────────────────────

export const AssetSnapshotSchema = z.object({
  id: z.string(),
  month: z.string(),           // YYYY-MM
  liquid_total: z.string().default('0'),
  non_liquid_total: z.string().default('0'),
  snapshot_at: z.string(),
})

export type AssetSnapshot = z.infer<typeof AssetSnapshotSchema>

// ─── Bill ─────────────────────────────────────────────────────────────────────

export const BillRecurrenceSchema = z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly'])
export type BillRecurrence = z.infer<typeof BillRecurrenceSchema>

export const BillSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.string().default('0'),
  due_date: z.string(),
  account_id: z.string().optional().default(''),
  category_id: z.string().optional().default(''),
  recurrence: BillRecurrenceSchema.catch('monthly'),
  notes: z.string().optional().default(''),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type Bill = z.infer<typeof BillSchema>

export const CreateBillSchema = z.object({
  name: z.string().min(1, 'Nama tagihan wajib diisi').max(200),
  amount: z.number().int().nonnegative('Jumlah tidak boleh negatif'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  account_id: z.string().default(''),
  category_id: z.string().default(''),
  recurrence: BillRecurrenceSchema.default('monthly'),
  notes: z.string().max(500).default(''),
})

export type CreateBillInput = z.infer<typeof CreateBillSchema>

export const UpdateBillSchema = CreateBillSchema.partial()
export type UpdateBillInput = z.infer<typeof UpdateBillSchema>

// ─── Bill Payment ─────────────────────────────────────────────────────────────

export const BillPaymentSchema = z.object({
  id: z.string(),
  bill_id: z.string(),
  transaction_id: z.string().optional().default(''),
  amount: z.string().default('0'),
  paid_at: z.string(),
  notes: z.string().optional().default(''),
  created_by: z.string(),
  created_at: z.string(),
})

export type BillPayment = z.infer<typeof BillPaymentSchema>

export const CreateBillPaymentSchema = z.object({
  amount: z.number().int().positive('Jumlah harus lebih dari 0'),
  paid_at: z.string().optional(),
  notes: z.string().max(500).default(''),
})

export type CreateBillPaymentInput = z.infer<typeof CreateBillPaymentSchema>

// ─── Price Rate ───────────────────────────────────────────────────────────────

export const PriceRateSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  label: z.string(),
  source: z.enum(['api', 'manual']),
  value_idr_per_unit: z.string().default('0'),
  unit: z.string().default(''),
  raw_api_data: z.string().optional().default(''),
  updated_at: z.string(),
})

export type PriceRate = z.infer<typeof PriceRateSchema>

export const CreatePriceRateSchema = z.object({
  symbol: z.string().min(1, 'Symbol wajib diisi').max(50).toUpperCase(),
  label: z.string().min(1, 'Label wajib diisi').max(100),
  unit: z.string().min(1, 'Satuan wajib diisi').max(50),
  value_idr_per_unit: z.number().nonnegative('Nilai tidak boleh negatif'),
})

export type CreatePriceRateInput = z.infer<typeof CreatePriceRateSchema>

export const UpdatePriceRateSchema = CreatePriceRateSchema.partial()
export type UpdatePriceRateInput = z.infer<typeof UpdatePriceRateSchema>

// ─── API Response ─────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

export function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data }
}

export function fail(error: string, code?: string): ApiResponse<never> {
  return { ok: false, error, code }
}
