import { NextResponse } from 'next/server'
import { budgetsRepo } from '@/integrations/sheets/repositories/budgets'
import { CreateBudgetSchema, ok, fail } from '@/domain/types'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  try {
    const budgets = month
      ? await budgetsRepo.findByMonth(month)
      : await budgetsRepo.findAll()
    return NextResponse.json(ok(budgets))
  } catch (err) {
    console.error('[budgets GET]', err)
    return NextResponse.json(fail('Gagal memuat anggaran'), { status: 500 })
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
    const parsed = CreateBudgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const now = new Date().toISOString()
    const id = generateId('budget')

    const budget = await budgetsRepo.upsert(parsed.data.month, parsed.data.category_id, {
      id,
      month: parsed.data.month,
      category_id: parsed.data.category_id,
      allocated_amount: String(parsed.data.allocated_amount),
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
      entityType: 'budget',
      entityId: budget.id,
      after: budget,
    })

    return NextResponse.json(ok(budget), { status: 201 })
  } catch (err) {
    console.error('[budgets POST]', err)
    return NextResponse.json(fail('Gagal menyimpan anggaran'), { status: 500 })
  }
}
