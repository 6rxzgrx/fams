import { auth } from '@/auth'
import { familyMembersRepo } from '@/integrations/sheets/repositories/family-members'
import type { FamilyMember } from '@/domain/types'
import { fail } from '@/domain/types'
import { NextResponse } from 'next/server'
import { isSheetsConfigured } from './env'

export async function getSessionMember(): Promise<
  { member: FamilyMember; error?: never } | { member?: never; error: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.email) {
    return { error: NextResponse.json(fail('Unauthorized'), { status: 401 }) }
  }
  if (!isSheetsConfigured()) {
    return { error: NextResponse.json(fail('Spreadsheet belum dikonfigurasi'), { status: 503 }) }
  }
  const member = await familyMembersRepo.findByEmail(session.user.email)
  if (!member) {
    return { error: NextResponse.json(fail('Akun tidak ditemukan di family members'), { status: 403 }) }
  }
  return { member }
}
