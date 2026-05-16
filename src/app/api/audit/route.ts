import { NextResponse } from 'next/server'
import { auditLogsRepo } from '@/integrations/sheets/repositories/audit-logs'
import { ok, fail } from '@/domain/types'
import { canAdmin } from '@/domain/permissions'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canAdmin(member)) {
    return NextResponse.json(fail('Hanya admin yang dapat melihat audit log'), { status: 403 })
  }

  const url = new URL(req.url)
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)

  try {
    const logs = await auditLogsRepo.findRecent(limit)
    return NextResponse.json(ok(logs))
  } catch (err) {
    console.error('[audit GET]', err)
    return NextResponse.json(fail('Gagal memuat audit log'), { status: 500 })
  }
}
