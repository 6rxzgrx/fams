import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { getSessionMember } from '@/lib/api-helpers'
import { deleteCalendarEvent } from '@/integrations/calendar/client'

const DeleteSchema = z.object({
  calendar_event_id: z.string().min(1),
})

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'reminders')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = DeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const deleted = await deleteCalendarEvent(parsed.data.calendar_event_id)
    if (!deleted) {
      return NextResponse.json(fail('Gagal menghapus acara dari Google Calendar'), { status: 500 })
    }

    return NextResponse.json(ok({ deleted: true }))
  } catch (err) {
    console.error('[calendar/delete POST]', err)
    return NextResponse.json(fail('Gagal menghapus acara kalender'), { status: 500 })
  }
}
