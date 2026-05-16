import { NextResponse } from 'next/server'
import { remindersRepo } from '@/integrations/sheets/repositories/reminders'
import { UpdateReminderSchema, ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'
import { updateCalendarEvent, deleteCalendarEvent } from '@/integrations/calendar/client'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    const existing = await remindersRepo.findById(id)
    if (!existing || existing.deleted_at) {
      return NextResponse.json(fail('Pengingat tidak ditemukan'), { status: 404 })
    }

    const body = await req.json()
    const parsed = UpdateReminderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const { push_to_calendar, is_done, ...fields } = parsed.data

    // Sync to Google Calendar if time or title changed and event exists
    const calendarFields = fields as { title?: string; description?: string; due_at?: string; recurrence?: string }
    if (
      push_to_calendar &&
      existing.calendar_event_id &&
      (calendarFields.title || calendarFields.due_at || calendarFields.recurrence !== undefined)
    ) {
      await updateCalendarEvent(existing.calendar_event_id, {
        title: calendarFields.title ?? existing.title,
        description: calendarFields.description ?? existing.description,
        startAt: calendarFields.due_at ?? existing.due_at,
        recurrence: (calendarFields.recurrence ?? existing.recurrence) as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
      })
    }

    const patch: Record<string, unknown> = { ...fields }
    if (is_done !== undefined) patch.is_done = String(is_done)

    const updated = await remindersRepo.update(id, patch)
    if (!updated) {
      return NextResponse.json(fail('Gagal memperbarui pengingat'), { status: 500 })
    }

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'reminder',
      entityId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[reminders PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui pengingat'), { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params
    const existing = await remindersRepo.findById(id)
    if (!existing || existing.deleted_at) {
      return NextResponse.json(fail('Pengingat tidak ditemukan'), { status: 404 })
    }

    // Delete from Google Calendar if synced
    if (existing.calendar_event_id) {
      await deleteCalendarEvent(existing.calendar_event_id)
    }

    await remindersRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'reminder',
      entityId: id,
      before: existing,
    })

    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[reminders DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus pengingat'), { status: 500 })
  }
}
