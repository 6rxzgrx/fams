import { NextResponse } from 'next/server'
import { settingsRepo } from '@/integrations/sheets/repositories/settings'
import { ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'
import { z } from 'zod'

function noteKey(month: string) {
  return `report_note_${month}`
}

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  const url = new URL(req.url)
  const month = url.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(fail('Parameter month tidak valid (YYYY-MM)'), { status: 400 })
  }

  try {
    const content = await settingsRepo.get(noteKey(month))
    return NextResponse.json(ok({ month, content: content ?? '' }))
  } catch (err) {
    console.error('[report-notes GET]', err)
    return NextResponse.json(fail('Gagal memuat catatan'), { status: 500 })
  }
}

const PutSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  content: z.string().max(5000),
})

export async function PUT(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const rl = checkRateLimit(member.id, 'writes')
  if (!rl.ok) {
    return NextResponse.json(fail('Terlalu banyak permintaan'), {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    })
  }

  try {
    const body = await req.json()
    const parsed = PutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const { month, content } = parsed.data
    await settingsRepo.set(noteKey(month), content)
    return NextResponse.json(ok({ month, content }))
  } catch (err) {
    console.error('[report-notes PUT]', err)
    return NextResponse.json(fail('Gagal menyimpan catatan'), { status: 500 })
  }
}
