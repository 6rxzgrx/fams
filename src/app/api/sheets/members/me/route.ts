import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { familyMembersRepo } from '@/integrations/sheets/repositories/family-members'
import { ok, fail } from '@/domain/types'
import { isSheetsConfigured } from '@/lib/env'

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json(fail('Unauthorized'), { status: 401 })
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(fail('not_configured', 'not_configured'), { status: 503 })
  }

  try {
    const member = await familyMembersRepo.findByEmail(session.user.email)
    if (!member) {
      return NextResponse.json(fail('Member tidak ditemukan', 'not_found'), { status: 404 })
    }
    return NextResponse.json(ok(member))
  } catch (err) {
    console.error('[members/me]', err)
    return NextResponse.json(fail('Gagal memuat data anggota'), { status: 500 })
  }
}
