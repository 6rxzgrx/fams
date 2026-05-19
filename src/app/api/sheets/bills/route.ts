import { NextResponse } from 'next/server'
import { billsRepo } from '@/integrations/sheets/repositories/bills'
import { CreateBillSchema, ok, fail } from '@/domain/types'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET() {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'bills')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const bills = await billsRepo.findAll()
    return NextResponse.json(ok(bills))
  } catch (err) {
    console.error('[bills GET]', err)
    return NextResponse.json(fail('Gagal memuat tagihan'), { status: 500 })
  }
}

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'bills')) {
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
    const parsed = CreateBillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const now = new Date().toISOString()
    const id = generateId('bill')

    const bill = await billsRepo.create({
      id,
      name: parsed.data.name,
      amount: String(parsed.data.amount),
      due_date: parsed.data.due_date,
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id,
      recurrence: parsed.data.recurrence,
      notes: parsed.data.notes,
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'bill',
      entityId: id,
      after: bill,
    })

    return NextResponse.json(ok(bill), { status: 201 })
  } catch (err) {
    console.error('[bills POST]', err)
    return NextResponse.json(fail('Gagal menyimpan tagihan'), { status: 500 })
  }
}
