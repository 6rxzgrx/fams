import { NextResponse } from 'next/server'
import { budgetsRepo } from '@/integrations/sheets/repositories/budgets'
import { UpdateBudgetSchema, ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = UpdateBudgetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const before = await budgetsRepo.findById(id)
    if (!before) return NextResponse.json(fail('Anggaran tidak ditemukan'), { status: 404 })

    const patch: Record<string, unknown> = {}
    if (parsed.data.allocated_amount !== undefined) patch.allocated_amount = String(parsed.data.allocated_amount)
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes

    const updated = await budgetsRepo.update(id, patch)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'budget',
      entityId: id,
      before,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[budgets PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui anggaran'), { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const before = await budgetsRepo.findById(id)
    if (!before) return NextResponse.json(fail('Anggaran tidak ditemukan'), { status: 404 })

    await budgetsRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'budget',
      entityId: id,
      before,
    })

    return NextResponse.json(ok(null))
  } catch (err) {
    console.error('[budgets DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus anggaran'), { status: 500 })
  }
}
