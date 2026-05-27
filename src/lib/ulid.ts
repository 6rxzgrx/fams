import { ulid } from 'ulid'

const PREFIXES = {
  transaction: 'tx',
  member: 'mem',
  account: 'acc',
  asset: 'ast',
  bill: 'bill',
  payment: 'pmt',
  reminder: 'rem',
  recurring: 'rec',
  note: 'note',
  audit: 'aud',
  category: 'cat',
  attachment: 'att',
  transfer: 'xfer',
  csm: 'csm',
  budget: 'bdg',
  snapshot: 'snap',
  pr: 'pr',
  ai_insight: 'ai',
  asset_mutation: 'amut',
  push_sub: 'psub',
  notif: 'notif',
} as const

type Entity = keyof typeof PREFIXES

export function generateId(entity: Entity): string {
  return `${PREFIXES[entity]}_${ulid()}`
}
