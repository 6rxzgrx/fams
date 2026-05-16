import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { getSessionMember } from '@/lib/api-helpers'
import { pushCalendarEvent } from '@/integrations/calendar/client'
import { calendarSyncMapRepo } from '@/integrations/sheets/repositories/calendar-sync-map'
import { generateId } from '@/lib/ulid'

const PushSchema = z.object({
  entity_type: z.string().min(1),
  entity_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  start_at: z.string().min(1),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']).default('none'),
})

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'reminders')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = PushSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const { entity_type, entity_id, title, description, start_at, recurrence } = parsed.data

    const eventId = await pushCalendarEvent({ title, description, startAt: start_at, recurrence })
    if (!eventId) {
      return NextResponse.json(fail('Gagal mengirim ke Google Calendar'), { status: 500 })
    }

    const now = new Date().toISOString()
    const syncEntry = await calendarSyncMapRepo.create({
      id: generateId('csm'),
      entity_type,
      entity_id,
      calendar_event_id: eventId,
      created_at: now,
    })

    return NextResponse.json(ok({ calendar_event_id: eventId, sync: syncEntry }), { status: 201 })
  } catch (err) {
    console.error('[calendar/push POST]', err)
    return NextResponse.json(fail('Gagal menyinkron ke kalender'), { status: 500 })
  }
}
