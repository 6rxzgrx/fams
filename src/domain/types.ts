import { z } from 'zod'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const RoleSchema = z.enum(['admin', 'editor', 'viewer'])
export type Role = z.infer<typeof RoleSchema>

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer', 'adjustment', 'refund'])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const AccountTypeSchema = z.enum(['cash', 'bank', 'ewallet', 'loan', 'investment', 'prepaid_card'])
export type AccountType = z.infer<typeof AccountTypeSchema>

export const AssetTypeSchema = z.enum(['investment', 'precious_metal', 'stocks', 'crypto', 'real_asset', 'business'])
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

// ─── Account ─────────────────────────────────────────────────────────────────

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AccountTypeSchema,
  currency: z.string().default('IDR'),
  current_balance: z.string().default('0'),
  bank_name: z.string().optional().default(''),
  account_number: z.string().optional().default(''),
  color: z.string().optional().default('#1e40af'),
  icon: z.string().optional().default('wallet'),
  notes: z.string().optional().default(''),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
  // Empty string means true (default include); only explicit 'false' excludes
  include_in_saldo: z.string().optional().default('true'),
})

export type Account = z.infer<typeof AccountSchema>

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Nama akun wajib diisi').max(100),
  type: AccountTypeSchema,
  currency: z.string().default('IDR'),
  current_balance: z.number().int().default(0),
  bank_name: z.string().max(100).default(''),
  account_number: z.string().max(100).default(''),
  color: z.string().default('#1e40af'),
  icon: z.string().default('wallet'),
  notes: z.string().max(500).default(''),
  include_in_saldo: z.boolean().default(true),
})

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>

export const UpdateAccountSchema = CreateAccountSchema.partial()
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>

// ─── Asset ────────────────────────────────────────────────────────────────────

export const AssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AssetTypeSchema.catch('real_asset'),
  value: z.string().default('0'),
  currency: z.string().default('IDR'),
  account_id: z.string().optional().default(''),
  include_in_saldo: z.string().optional().default('false'),
  notes: z.string().optional().default(''),
  icon: z.string().optional().default('briefcase'),
  color: z.string().optional().default('#64748b'),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().optional().default(''),
})

export type Asset = z.infer<typeof AssetSchema>

export const CreateAssetSchema = z.object({
  name: z.string().min(1, 'Nama aset wajib diisi').max(100),
  type: AssetTypeSchema,
  value: z.number().int().nonnegative('Nilai tidak boleh negatif'),
  currency: z.string().default('IDR'),
  account_id: z.string().default(''),
  include_in_saldo: z.boolean().default(false),
  notes: z.string().max(500).default(''),
  icon: z.string().default('briefcase'),
  color: z.string().default('#64748b'),
})

export type CreateAssetInput = z.infer<typeof CreateAssetSchema>

export const UpdateAssetSchema = CreateAssetSchema.partial()
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>

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
