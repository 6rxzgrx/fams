// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { spentForType } from '@/domain/transactions'
import type { TransactionCategory } from '@/domain/types'

const base: Omit<TransactionCategory, 'id'> = {
  name: '',
  type: 'expense',
  icon: 'tag',
  color: '#000',
  parent_id: '',
  budget_type: '',
  created_by: '',
  created_at: '',
  updated_at: '',
  deleted_at: '',
}

const cats: TransactionCategory[] = [
  { ...base, id: 'p1', budget_type: 'needs' },               // parent: needs
  { ...base, id: 'c1a', parent_id: 'p1' },                   // child of p1 → inherits needs
  { ...base, id: 'c1b', parent_id: 'p1' },                   // child of p1 → inherits needs
  { ...base, id: 'p2', budget_type: 'wants' },               // parent: wants
  { ...base, id: 'c2a', parent_id: 'p2' },                   // child of p2 → inherits wants
  { ...base, id: 'p3', budget_type: 'needs', deleted_at: '2026-01-01' }, // deleted parent
]

describe('spentForType', () => {
  it('sums parent and all child spend for the matching type', () => {
    const spent = { p1: 100_000, c1a: 50_000, c1b: 25_000 }
    expect(spentForType('needs', cats, spent)).toBe(175_000)
  })

  it('excludes categories belonging to a different type', () => {
    const spent = { p1: 100_000, p2: 200_000, c2a: 80_000 }
    expect(spentForType('wants', cats, spent)).toBe(280_000)
  })

  it('returns 0 when no categories match', () => {
    expect(spentForType('savings', cats, { p1: 999 })).toBe(0)
  })

  it('ignores deleted parent categories and their children', () => {
    const spent = { p3: 100_000 }
    expect(spentForType('needs', cats, spent)).toBe(0)
  })

  it('ignores income and transfer categories', () => {
    const mixed: TransactionCategory[] = [
      { ...base, id: 'i1', type: 'income', budget_type: 'needs' },
      { ...base, id: 'p1', budget_type: 'needs' },
    ]
    expect(spentForType('needs', mixed, { i1: 500_000, p1: 100_000 })).toBe(100_000)
  })
})
