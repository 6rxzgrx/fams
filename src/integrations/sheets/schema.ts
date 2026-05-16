// Column definitions for each Google Sheets tab.
// Order matters: index 0 = column A, 1 = B, etc.

export const TABS = {
  family_members: 'family_members',
  accounts: 'accounts',
  assets: 'assets',
  transactions: 'transactions',
  transaction_categories: 'transaction_categories',
  bills: 'bills',
  bill_payments: 'bill_payments',
  budgets: 'budgets',
  reminders: 'reminders',
  recurring_rules: 'recurring_rules',
  notes: 'notes',
  settings: 'settings',
  audit_logs: 'audit_logs',
  calendar_sync_map: 'calendar_sync_map',
  ai_extraction_logs: 'ai_extraction_logs',
  attachments: 'attachments',
  _system: '_system',
} as const

export type TabName = keyof typeof TABS

export const COLUMNS: Record<TabName, string[]> = {
  family_members: ['id', 'email', 'name', 'role', 'avatar_url', 'module_access', 'created_at', 'updated_at', 'deleted_at'],
  accounts: ['id', 'name', 'type', 'currency', 'current_balance', 'bank_name', 'account_number', 'color', 'icon', 'notes', 'created_by', 'created_at', 'updated_at', 'deleted_at', 'include_in_saldo'],
  assets: ['id', 'name', 'type', 'value', 'currency', 'account_id', 'include_in_saldo', 'notes', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  transactions: ['id', 'account_id', 'category_id', 'type', 'amount', 'description', 'date', 'reference_no', 'notes', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  transaction_categories: ['id', 'name', 'type', 'icon', 'color', 'parent_id', 'is_system', 'created_at', 'updated_at', 'deleted_at'],
  bills: ['id', 'name', 'amount', 'due_date', 'account_id', 'category_id', 'recurrence', 'notes', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  bill_payments: ['id', 'bill_id', 'transaction_id', 'amount', 'paid_at', 'notes', 'created_by', 'created_at'],
  budgets: ['id', 'month', 'category_id', 'allocated_amount', 'notes', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  reminders: ['id', 'title', 'description', 'due_at', 'recurrence', 'calendar_event_id', 'is_done', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  recurring_rules: ['id', 'entity_type', 'entity_id', 'rrule', 'next_run_at', 'last_run_at', 'is_active', 'created_at', 'updated_at'],
  notes: ['id', 'title', 'content', 'created_by', 'created_at', 'updated_at', 'deleted_at'],
  settings: ['key', 'value', 'updated_at'],
  audit_logs: ['id', 'member_id', 'member_name', 'action', 'entity_type', 'entity_id', 'before_data', 'after_data', 'created_at'],
  calendar_sync_map: ['id', 'entity_type', 'entity_id', 'calendar_event_id', 'created_at'],
  ai_extraction_logs: ['id', 'raw_response', 'parsed_data', 'confidence', 'cost_usd', 'created_by', 'created_at'],
  attachments: ['id', 'entity_type', 'entity_id', 'filename', 'mime_type', 'drive_file_id', 'url', 'created_by', 'created_at'],
  _system: ['key', 'value'],
}

export function columnToLetter(col: number): string {
  let letter = ''
  let n = col + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}

export function getRange(tab: TabName, startRow = 1, endRow?: number): string {
  const cols = COLUMNS[tab]
  const lastCol = columnToLetter(cols.length - 1)
  const end = endRow ? endRow : ''
  return `${tab}!A${startRow}:${lastCol}${end}`
}

export function rowToObject<T extends Record<string, unknown>>(tab: TabName, row: string[]): T {
  const cols = COLUMNS[tab]
  const obj: Record<string, unknown> = {}
  cols.forEach((col, i) => {
    obj[col] = row[i] ?? ''
  })
  return obj as T
}

export function objectToRow(tab: TabName, obj: Record<string, unknown>): string[] {
  return COLUMNS[tab].map((col) => {
    const val = obj[col]
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  })
}
