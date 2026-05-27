import { SheetRepository } from '../repository'
import type { PushSubscription } from '@/domain/types'

class PushSubscriptionsRepository extends SheetRepository<PushSubscription> {
  constructor() {
    super('push_subscriptions')
  }

  async findActive(): Promise<PushSubscription[]> {
    return this.findAll() // findAll already filters deleted_at
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const all = await this.findAll(true)
    return all.find((s) => s.endpoint === endpoint) ?? null
  }

  async softDeleteByEndpoint(endpoint: string): Promise<boolean> {
    const sub = await this.findByEndpoint(endpoint)
    if (!sub) return false
    await this.update(sub.id, { deleted_at: new Date().toISOString() })
    return true
  }
}

export const pushSubscriptionsRepo = new PushSubscriptionsRepository()
