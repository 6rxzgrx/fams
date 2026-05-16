import type { FamilyMember, Role } from './types'

type Module = 'transactions' | 'bills' | 'assets' | 'accounts' | 'reminders' | 'settings'

function parseModuleAccess(raw: string): Record<string, boolean> {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

export function canRead(member: FamilyMember, module: Module): boolean {
  if (member.role === 'admin') return true
  const access = parseModuleAccess(member.module_access)
  return access[module] !== false
}

export function canWrite(member: FamilyMember, module: Module): boolean {
  if (member.role === 'admin') return true
  if (member.role === 'viewer') return false
  const access = parseModuleAccess(member.module_access)
  return access[module] !== false
}

export function canAdmin(member: FamilyMember): boolean {
  return member.role === 'admin'
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Penonton',
}
