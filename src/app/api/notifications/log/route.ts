import { NextResponse } from 'next/server'
import { getSessionMember } from '@/lib/api-helpers'
import { notificationLogRepo } from '@/integrations/sheets/repositories/notification-log'
import { ok, fail } from '@/domain/types'

export async function GET() {
  const { member, error } = await getSessionMember()
  if (error) return error

  try {
    const logs = await notificationLogRepo.findByMember(member.id, 50)
    return NextResponse.json(ok(logs))
  } catch (err) {
    console.error('[notifications/log GET]', err)
    return NextResponse.json(fail('Gagal memuat log notifikasi'), { status: 500 })
  }
}
