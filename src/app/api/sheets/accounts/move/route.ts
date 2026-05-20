import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

const MoveBalanceSchema = z.object({
  from_id: z.string().min(1),
  to_id: z.string().min(1),
  amount: z.number().int().positive('Jumlah harus lebih dari 0'),
})

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'accounts')) {
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
    const parsed = MoveBalanceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const { from_id, to_id, amount } = parsed.data

    if (from_id === to_id) {
      return NextResponse.json(fail('Akun asal dan tujuan tidak boleh sama'), { status: 400 })
    }

    const [fromAcc, toAcc] = await Promise.all([
      assetsRepo.findById(from_id),
      assetsRepo.findById(to_id),
    ])

    if (!fromAcc || fromAcc.kind !== 'liquid' || fromAcc.deleted_at) {
      return NextResponse.json(fail('Akun asal tidak ditemukan'), { status: 404 })
    }
    if (!toAcc || toAcc.kind !== 'liquid' || toAcc.deleted_at) {
      return NextResponse.json(fail('Akun tujuan tidak ditemukan'), { status: 404 })
    }

    const fromBalance = parseInt(fromAcc.current_balance, 10) || 0
    if (amount > fromBalance) {
      return NextResponse.json(fail('Saldo akun asal tidak cukup'), { status: 422 })
    }

    const toBalance = parseInt(toAcc.current_balance, 10) || 0

    const [updatedFrom, updatedTo] = await Promise.all([
      assetsRepo.update(from_id, { current_balance: String(fromBalance - amount) }),
      assetsRepo.update(to_id, { current_balance: String(toBalance + amount) }),
    ])

    await Promise.all([
      writeAudit({
        memberId: member.id,
        memberName: member.name,
        action: 'update',
        entityType: 'account',
        entityId: from_id,
        before: fromAcc,
        after: updatedFrom,
      }),
      writeAudit({
        memberId: member.id,
        memberName: member.name,
        action: 'update',
        entityType: 'account',
        entityId: to_id,
        before: toAcc,
        after: updatedTo,
      }),
    ])

    return NextResponse.json(ok({ from: updatedFrom, to: updatedTo }))
  } catch (err) {
    console.error('[accounts/move POST]', err)
    return NextResponse.json(fail('Gagal memindahkan saldo'), { status: 500 })
  }
}
