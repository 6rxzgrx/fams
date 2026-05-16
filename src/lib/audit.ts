import { auditLogsRepo } from '@/integrations/sheets/repositories/audit-logs'
import { generateId } from './ulid'

interface WriteAuditParams {
  memberId: string
  memberName: string
  action: 'create' | 'update' | 'delete'
  entityType: string
  entityId: string
  before?: unknown
  after?: unknown
}

export async function writeAudit(params: WriteAuditParams): Promise<void> {
  try {
    await auditLogsRepo.create({
      id: generateId('audit'),
      member_id: params.memberId,
      member_name: params.memberName,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      before_data: params.before ? JSON.stringify(params.before) : '',
      after_data: params.after ? JSON.stringify(params.after) : '',
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    // Audit failures must not block the main operation
    console.error('[audit] write failed', err)
  }
}
