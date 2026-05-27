import { SheetRepository } from '../repository'
import type { AuditLog } from '@/domain/types'

export class AuditLogsRepository extends SheetRepository<AuditLog> {
  constructor() {
    super('audit_logs')
  }

  async findRecent(limit = 50): Promise<AuditLog[]> {
    const all = await this.findAll(true)
    return all
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  async findByEntityTypes(types: string[]): Promise<AuditLog[]> {
    const all = await this.findAll(true)
    return all
      .filter((log) => types.includes(log.entity_type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
}

export const auditLogsRepo = new AuditLogsRepository()
