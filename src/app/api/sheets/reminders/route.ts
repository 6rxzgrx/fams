import { NextResponse } from 'next/server'
import { remindersRepo } from '@/integrations/sheets/repositories/reminders'
import { CreateReminderSchema, ok, fail } from '@/domain/types'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'
import { pushCalendarEvent } from '@/integrations/calendar/client'

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'reminders')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const url = new URL(req.url)
  const doneFilter = url.searchParams.get('done') // 'true' | 'false' | null

  try {
    let reminders = await remindersRepo.findAll()

    if (doneFilter === 'true') {
      reminders = reminders.filter((r) => r.is_done === 'true')
    } else if (doneFilter === 'false') {
      reminders = reminders.filter((r) => r.is_done !== 'true')
    }

    reminders.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())

    return NextResponse.json(ok(reminders))
  } catch (err) {
    console.error('[reminders GET]', err)
    return NextResponse.json(fail('Gagal memuat pengingat'), { status: 500 })
  }
}

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'reminders')) {
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
    const parsed = CreateReminderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const { push_to_calendar, ...data } = parsed.data
    const now = new Date().toISOString()
    const id = generateId('reminder')

    let calendarEventId = ''
    if (push_to_calendar) {
      calendarEventId =
        (await pushCalendarEvent({
          title: data.title,
          description: data.description,
          startAt: data.due_at,
          recurrence: data.recurrence,
        })) ?? ''
    }

    const reminder = await remindersRepo.create({
      id,
      title: data.title,
      description: data.description ?? '',
      due_at: data.due_at,
      recurrence: data.recurrence,
      calendar_event_id: calendarEventId,
      is_done: 'false',
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'reminder',
      entityId: id,
      after: reminder,
    })

    return NextResponse.json(ok(reminder), { status: 201 })
  } catch (err) {
    console.error('[reminders POST]', err)
    return NextResponse.json(fail('Gagal menyimpan pengingat'), { status: 500 })
  }
}
