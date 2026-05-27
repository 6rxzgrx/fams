import { SheetRepository } from '../repository'
import type { NotificationLog } from '@/domain/types'

class NotificationLogRepository extends SheetRepository<NotificationLog> {
  constructor() {
    super('notification_log')
  }

  async findByMember(memberId: string, limit = 50): Promise<NotificationLog[]> {
    const all = await this.findAll(true) // no deleted_at on this tab
    return all
      .filter((n) => n.member_id === memberId)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
      .slice(0, limit)
  }

  async existsRecentForEntity(entityId: string, memberId: string, windowMs: number): Promise<boolean> {
    const all = await this.findAll(true)
    const cutoff = new Date(Date.now() - windowMs).toISOString()
    return all.some(
      (n) =>
        n.entity_id === entityId &&
        n.member_id === memberId &&
        n.sent_at > cutoff &&
        n.status === 'sent',
    )
  }
}

export const notificationLogRepo = new NotificationLogRepository()
