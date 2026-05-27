import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionMember } from '@/lib/api-helpers'
import { pushSubscriptionsRepo } from '@/integrations/sheets/repositories/push-subscriptions'
import { generateId } from '@/lib/ulid'
import { ok, fail } from '@/domain/types'

const SubscribeBody = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  userAgent: z.string().optional().default(''),
})

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  const body = await req.json()
  const parsed = SubscribeBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
  }

  try {
    // Avoid duplicates — check if endpoint already active
    const existing = await pushSubscriptionsRepo.findByEndpoint(parsed.data.endpoint)
    if (existing && !existing.deleted_at) {
      return NextResponse.json(ok({ id: existing.id }))
    }

    const now = new Date().toISOString()
    const sub = await pushSubscriptionsRepo.create({
      id: generateId('push_sub'),
      member_id: member.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
      user_agent: parsed.data.userAgent,
      created_at: now,
      deleted_at: '',
    })

    return NextResponse.json(ok({ id: sub.id }), { status: 201 })
  } catch (err) {
    console.error('[notifications/subscribe POST]', err)
    return NextResponse.json(fail('Gagal menyimpan subscription'), { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  const body = await req.json()
  const { endpoint } = z.object({ endpoint: z.string() }).parse(body)

  try {
    await pushSubscriptionsRepo.softDeleteByEndpoint(endpoint)
    return NextResponse.json(ok(null))
  } catch (err) {
    console.error('[notifications/subscribe DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus subscription'), { status: 500 })
  }
}
