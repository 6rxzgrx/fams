import { getCalendarClient } from '@/integrations/sheets/client'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export interface CalendarEventInput {
  title: string
  description?: string
  startAt: string // ISO 8601 datetime (e.g. "2025-12-31T09:00:00+07:00") or datetime-local ("2025-12-31T09:00")
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
}

const JAKARTA_TZ = 'Asia/Jakarta'

function buildRrule(recurrence: string): string[] {
  const map: Record<string, string> = {
    daily: 'RRULE:FREQ=DAILY',
    weekly: 'RRULE:FREQ=WEEKLY',
    monthly: 'RRULE:FREQ=MONTHLY',
    yearly: 'RRULE:FREQ=YEARLY',
  }
  return map[recurrence] ? [map[recurrence]] : []
}

// Converts datetime-local string ("2025-12-31T09:00") to full ISO with Jakarta offset
function toIso(dt: string): string {
  if (dt.length === 16) {
    // datetime-local format — assume Jakarta (+07:00)
    return `${dt}:00+07:00`
  }
  return dt
}

function toCalendarTime(iso: string) {
  return { dateTime: toIso(iso), timeZone: JAKARTA_TZ }
}

function toEndTime(startIso: string): string {
  // 1-hour event
  const ms = new Date(toIso(startIso)).getTime() + 60 * 60 * 1000
  return new Date(ms).toISOString()
}

export async function pushCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  if (!env.GOOGLE_CALENDAR_ID) {
    logger.warn('[calendar] GOOGLE_CALENDAR_ID not configured — skipping push')
    return null
  }
  try {
    const calendar = await getCalendarClient()
    const res = await calendar.events.insert({
      calendarId: env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: input.title,
        description: input.description ?? '',
        start: toCalendarTime(input.startAt),
        end: toCalendarTime(toEndTime(input.startAt)),
        recurrence:
          input.recurrence && input.recurrence !== 'none'
            ? buildRrule(input.recurrence)
            : undefined,
      },
    })
    logger.info('[calendar] event created', { eventId: res.data.id })
    return res.data.id ?? null
  } catch (err) {
    logger.error('[calendar] pushCalendarEvent failed', err)
    return null
  }
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput,
): Promise<boolean> {
  if (!env.GOOGLE_CALENDAR_ID || !eventId) return false
  try {
    const calendar = await getCalendarClient()
    await calendar.events.update({
      calendarId: env.GOOGLE_CALENDAR_ID,
      eventId,
      requestBody: {
        summary: input.title,
        description: input.description ?? '',
        start: toCalendarTime(input.startAt),
        end: toCalendarTime(toEndTime(input.startAt)),
        recurrence:
          input.recurrence && input.recurrence !== 'none'
            ? buildRrule(input.recurrence)
            : undefined,
      },
    })
    logger.info('[calendar] event updated', { eventId })
    return true
  } catch (err) {
    logger.error('[calendar] updateCalendarEvent failed', err)
    return false
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!env.GOOGLE_CALENDAR_ID || !eventId) return false
  try {
    const calendar = await getCalendarClient()
    await calendar.events.delete({
      calendarId: env.GOOGLE_CALENDAR_ID,
      eventId,
    })
    logger.info('[calendar] event deleted', { eventId })
    return true
  } catch (err) {
    logger.error('[calendar] deleteCalendarEvent failed', err)
    return false
  }
}
