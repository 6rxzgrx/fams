import { SheetRepository } from '../repository'
import type { Reminder } from '@/domain/types'

class RemindersRepository extends SheetRepository<Reminder> {
  constructor() {
    super('reminders')
  }

  async findPending(): Promise<Reminder[]> {
    const all = await this.findAll()
    return all.filter((r) => r.is_done !== 'true')
  }

  async findDone(): Promise<Reminder[]> {
    const all = await this.findAll()
    return all.filter((r) => r.is_done === 'true')
  }
}

export const remindersRepo = new RemindersRepository()
