// In-memory conversation state for the polling bot.
// Each chat tracks one active draft at a time; expires after 10 minutes of inactivity.

export type TxType = 'expense' | 'income' | 'transfer'
export type TxStep = 'type' | 'account' | 'to_account' | 'amount' | 'description' | 'confirm'

export interface TxDraft {
  step: TxStep
  userId: number  // only this user can advance the draft
  type?: TxType
  account_id?: string
  account_name?: string
  to_account_id?: string
  to_account_name?: string
  amount?: number
  description?: string
  expiresAt: number
}

const EXPIRE_MS = 10 * 60 * 1000

const drafts = new Map<number, TxDraft>()

export function getDraft(chatId: number): TxDraft | undefined {
  const d = drafts.get(chatId)
  if (!d || d.expiresAt < Date.now()) {
    drafts.delete(chatId)
    return undefined
  }
  return d
}

export function setDraft(chatId: number, patch: Partial<TxDraft>): TxDraft {
  const existing = drafts.get(chatId)
  const userId = patch.userId ?? existing?.userId

  if (!userId) {
    throw new Error('userId is required when starting a draft')
  }

  const next: TxDraft = {
    step: patch.step ?? existing?.step ?? 'type',
    userId,
    type: patch.type ?? existing?.type,
    account_id: patch.account_id ?? existing?.account_id,
    account_name: patch.account_name ?? existing?.account_name,
    to_account_id: patch.to_account_id ?? existing?.to_account_id,
    to_account_name: patch.to_account_name ?? existing?.to_account_name,
    amount: patch.amount ?? existing?.amount,
    description: patch.description ?? existing?.description,
    expiresAt: Date.now() + EXPIRE_MS,
  }
  drafts.set(chatId, next)
  return next
}

export function clearDraft(chatId: number) {
  drafts.delete(chatId)
}
