import { SheetRepository } from '../repository'
import type { FamilyMember } from '@/domain/types'

export class FamilyMembersRepository extends SheetRepository<FamilyMember> {
  constructor() {
    super('family_members')
  }

  async findByEmail(email: string): Promise<FamilyMember | null> {
    const all = await this.findAll()
    return all.find((m) => m.email === email) ?? null
  }
}

export const familyMembersRepo = new FamilyMembersRepository()
