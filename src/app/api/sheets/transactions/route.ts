import { NextResponse } from 'next/server'
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { CreateTransactionSchema, ok, fail } from '@/domain/types'
import { validateFinalCategorySelection } from '@/domain/categories'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'
import { computeBalanceDelta } from '@/domain/transactions'

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const url = new URL(req.url)
  const accountId = url.searchParams.get('account_id')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10)

  try {
    let transactions = await transactionsRepo.findAll()

    if (accountId) transactions = transactions.filter((t) => t.account_id === accountId)
    if (from) transactions = transactions.filter((t) => t.date >= from)
    if (to) transactions = transactions.filter((t) => t.date <= to)

    transactions.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json(ok(transactions.slice(0, limit)))
  } catch (err) {
    console.error('[transactions GET]', err)
    return NextResponse.json(fail('Gagal memuat transaksi'), { status: 500 })
  }
}

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
    const parsed = CreateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const categories = await categoriesRepo.findAll()
    const expectedCategoryType =
      parsed.data.type === 'income' || parsed.data.type === 'expense' || parsed.data.type === 'transfer'
        ? parsed.data.type
        : undefined

    if (!expectedCategoryType) {
      return NextResponse.json(fail('Jenis transaksi ini tidak didukung untuk pemilihan kategori.'), { status: 400 })
    }

    const categoryValidation = validateFinalCategorySelection(
      categories,
      parsed.data.category_id,
      expectedCategoryType,
    )
    if (categoryValidation.error) {
      return NextResponse.json(fail(categoryValidation.error), { status: 400 })
    }

    const now = new Date().toISOString()
    const id = generateId('transaction')

    const transaction = await transactionsRepo.create({
      id,
      account_id: parsed.data.account_id,
      category_id: parsed.data.category_id ?? '',
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      description: parsed.data.description,
      date: parsed.data.date,
      reference_no: parsed.data.reference_no ?? '',
      notes: parsed.data.notes ?? '',
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    // Keep account balance in sync
    const delta = computeBalanceDelta(parsed.data.type, parsed.data.amount)
    await accountsRepo.applyBalanceDelta(parsed.data.account_id, delta)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'transaction',
      entityId: id,
      after: transaction,
    })

    return NextResponse.json(ok(transaction), { status: 201 })
  } catch (err) {
    console.error('[transactions POST]', err)
    return NextResponse.json(fail('Gagal menyimpan transaksi'), { status: 500 })
  }
}
