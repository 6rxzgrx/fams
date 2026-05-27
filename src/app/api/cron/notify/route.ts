import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { env } from '@/lib/env'
import { pushSubscriptionsRepo } from '@/integrations/sheets/repositories/push-subscriptions'
import { notificationLogRepo } from '@/integrations/sheets/repositories/notification-log'
import { billsRepo } from '@/integrations/sheets/repositories/bills'
import { remindersRepo } from '@/integrations/sheets/repositories/reminders'
import { generateId } from '@/lib/ulid'

webpush.setVapidDetails(
  env.VAPID_SUBJECT || 'mailto:admin@example.com',
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
)

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

function todayStr(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: Request) {
  // Protect with CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 503 })
  }

  const today = todayStr()
  const threeDaysLater = addDays(today, 3)

  const [subscriptions, bills, reminders] = await Promise.all([
    pushSubscriptionsRepo.findActive(),
    billsRepo.findAll(),
    remindersRepo.findPending(),
  ])

  // Group subscriptions by member_id for lookup
  const subsByMember = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions) {
    const list = subsByMember.get(sub.member_id) ?? []
    list.push(sub)
    subsByMember.set(sub.member_id, list)
  }

  // Get all member IDs that have subscriptions
  const memberIds = [...subsByMember.keys()]

  // Build notification events
  type NotifEvent = { type: 'bill_due' | 'reminder'; entityId: string; title: string; body: string; url: string }
  const events: NotifEvent[] = []

  for (const bill of bills) {
    if (!bill.due_date) continue
    if (bill.due_date >= today && bill.due_date <= threeDaysLater) {
      const daysLeft = Math.round(
        (new Date(bill.due_date).getTime() - new Date(today).getTime()) / 86400000,
      )
      const bodyText =
        daysLeft === 0 ? 'Jatuh tempo hari ini' : `Jatuh tempo ${daysLeft} hari lagi`
      events.push({
        type: 'bill_due',
        entityId: bill.id,
        title: `Tagihan: ${bill.name}`,
        body: bodyText,
        url: '/finance/bills',
      })
    }
  }

  for (const reminder of reminders) {
    if (!reminder.due_at) continue
    const dueDate = reminder.due_at.slice(0, 10)
    if (dueDate === today) {
      events.push({
        type: 'reminder',
        entityId: reminder.id,
        title: `Pengingat: ${reminder.title}`,
        body: reminder.description || 'Hari ini',
        url: '/calendar/reminders',
      })
    }
  }

  let sent = 0
  let skipped = 0
  let failed = 0
  const sentAt = new Date().toISOString()

  for (const event of events) {
    for (const memberId of memberIds) {
      // De-duplicate: skip if sent in last 24h
      const alreadySent = await notificationLogRepo.existsRecentForEntity(
        event.entityId,
        memberId,
        DEDUP_WINDOW_MS,
      )
      if (alreadySent) {
        skipped++
        continue
      }

      const subs = subsByMember.get(memberId) ?? []
      let memberStatus: 'sent' | 'failed' = 'failed'

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: event.title, body: event.body, url: event.url }),
          )
          memberStatus = 'sent'
          sent++
        } catch (err) {
          console.error(`[cron/notify] push failed for sub ${sub.id}`, err)
          failed++
        }
      }

      await notificationLogRepo.create({
        id: generateId('notif'),
        member_id: memberId,
        type: event.type,
        entity_id: event.entityId,
        title: event.title,
        body: event.body,
        sent_at: sentAt,
        status: memberStatus,
      })
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, failed })
}
