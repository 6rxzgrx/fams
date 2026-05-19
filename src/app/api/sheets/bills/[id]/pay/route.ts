import { NextResponse } from 'next/server'
import { billsRepo } from '@/integrations/sheets/repositories/bills'
import { billPaymentsRepo } from '@/integrations/sheets/repositories/bill-payments'
import { CreateBillPaymentSchema, ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id: billId } = await params

  try {
    const bill = await billsRepo.findById(billId)
    if (!bill) {
      return NextResponse.json(fail('Tagihan tidak ditemukan'), { status: 404 })
    }

    const body = await req.json()
    const parsed = CreateBillPaymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const now = new Date().toISOString()
    const paymentId = generateId('payment')

    const payment = await billPaymentsRepo.create({
      id: paymentId,
      bill_id: billId,
      transaction_id: '',
      amount: String(parsed.data.amount),
      paid_at: parsed.data.paid_at ?? now,
      notes: parsed.data.notes,
      created_by: member.id,
      created_at: now,
    })

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'bill_payment',
      entityId: paymentId,
      after: payment,
    })

    return NextResponse.json(ok(payment), { status: 201 })
  } catch (err) {
    console.error('[bills pay POST]', err)
    return NextResponse.json(fail('Gagal mencatat pembayaran'), { status: 500 })
  }
}
