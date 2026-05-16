import { NextResponse } from 'next/server'
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { CreateTransferSchema, ok, fail } from '@/domain/types'
import { validateFinalCategorySelection } from '@/domain/categories'
import { canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
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
    const parsed = CreateTransferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const categories = await categoriesRepo.findAll()
    const categoryValidation = validateFinalCategorySelection(
      categories,
      parsed.data.category_id,
      'transfer',
    )
    if (categoryValidation.error) {
      return NextResponse.json(fail(categoryValidation.error), { status: 400 })
    }

    const [fromAcc, toAcc] = await Promise.all([
      accountsRepo.findById(parsed.data.from_account_id),
      accountsRepo.findById(parsed.data.to_account_id),
    ])
    if (!fromAcc) return NextResponse.json(fail('Akun sumber tidak ditemukan'), { status: 404 })
    if (!toAcc) return NextResponse.json(fail('Akun tujuan tidak ditemukan'), { status: 404 })

    const now = new Date().toISOString()
    const transferRef = generateId('transfer')
    const amount = String(parsed.data.amount)

    // Outgoing: leaves from_account_id (treated as expense-side)
    const outId = generateId('transaction')
    await transactionsRepo.create({
      id: outId,
      account_id: parsed.data.from_account_id,
      category_id: parsed.data.category_id,
      type: 'transfer',
      amount,
      description: `${parsed.data.description} → ${toAcc.name}`,
      date: parsed.data.date,
      reference_no: transferRef,
      notes: parsed.data.notes,
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    // Incoming: arrives at to_account_id
    const inId = generateId('transaction')
    await transactionsRepo.create({
      id: inId,
      account_id: parsed.data.to_account_id,
      category_id: parsed.data.category_id,
      type: 'transfer',
      amount,
      description: `${parsed.data.description} ← ${fromAcc.name}`,
      date: parsed.data.date,
      reference_no: transferRef,
      notes: parsed.data.notes,
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    // Keep balances in sync: from loses, to gains
    const numericAmount = parsed.data.amount
    await Promise.all([
      accountsRepo.applyBalanceDelta(parsed.data.from_account_id, -numericAmount),
      accountsRepo.applyBalanceDelta(parsed.data.to_account_id, numericAmount),
    ])

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'transfer',
      entityId: transferRef,
      after: {
        transfer_ref: transferRef,
        from_account_id: parsed.data.from_account_id,
        to_account_id: parsed.data.to_account_id,
        amount,
        date: parsed.data.date,
        out_transaction_id: outId,
        in_transaction_id: inId,
      },
    })

    return NextResponse.json(ok({ transfer_ref: transferRef, out_transaction_id: outId, in_transaction_id: inId }), { status: 201 })
  } catch (err) {
    console.error('[transfer POST]', err)
    return NextResponse.json(fail('Gagal melakukan transfer'), { status: 500 })
  }
}
