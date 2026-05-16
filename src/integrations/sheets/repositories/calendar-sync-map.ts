import { SheetRepository } from '../repository'
import type { CalendarSyncMap } from '@/domain/types'

class CalendarSyncMapRepository extends SheetRepository<CalendarSyncMap> {
  constructor() {
    super('calendar_sync_map')
  }

  async findByEntityId(entityId: string): Promise<CalendarSyncMap | null> {
    const all = await this.findAll()
    return all.find((m) => m.entity_id === entityId) ?? null
  }

  async findByCalendarEventId(eventId: string): Promise<CalendarSyncMap | null> {
    const all = await this.findAll()
    return all.find((m) => m.calendar_event_id === eventId) ?? null
  }
}

export const calendarSyncMapRepo = new CalendarSyncMapRepository()
