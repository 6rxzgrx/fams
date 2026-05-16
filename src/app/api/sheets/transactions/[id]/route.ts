import { NextResponse } from 'next/server'
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { UpdateTransactionSchema, ok, fail } from '@/domain/types'
import { validateFinalCategorySelection } from '@/domain/categories'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { getSessionMember } from '@/lib/api-helpers'
import { computeBalanceDelta } from '@/domain/transactions'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = UpdateTransactionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const existing = await transactionsRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Transaksi tidak ditemukan'), { status: 404 })
    }

    const nextCategoryId = parsed.data.category_id ?? existing.category_id
    const nextType = parsed.data.type ?? existing.type

    if (nextCategoryId) {
      const categories = await categoriesRepo.findAll()
      const categoryValidation = validateFinalCategorySelection(
        categories,
        nextCategoryId,
        nextType === 'income' || nextType === 'expense' || nextType === 'transfer'
          ? nextType
          : undefined,
      )
      if (categoryValidation.error) {
        return NextResponse.json(fail(categoryValidation.error), { status: 400 })
      }
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.account_id !== undefined) patch.account_id = parsed.data.account_id
    if (parsed.data.category_id !== undefined) patch.category_id = parsed.data.category_id
    if (parsed.data.type !== undefined) patch.type = parsed.data.type
    if (parsed.data.amount !== undefined) patch.amount = String(parsed.data.amount)
    if (parsed.data.description !== undefined) patch.description = parsed.data.description
    if (parsed.data.date !== undefined) patch.date = parsed.data.date
    if (parsed.data.reference_no !== undefined) patch.reference_no = parsed.data.reference_no
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes

    // Revert old balance effect, apply new effect (only if type or amount changed)
    const oldType = existing.type
    const oldAmount = parseInt(existing.amount, 10) || 0
    const newType = (parsed.data.type ?? existing.type)
    const newAmount = parsed.data.amount ?? oldAmount
    const accountId = (parsed.data.account_id ?? existing.account_id)

    const oldDelta = computeBalanceDelta(oldType, oldAmount)
    const newDelta = computeBalanceDelta(newType, newAmount)
    const balanceAdjust = newDelta - oldDelta

    if (balanceAdjust !== 0) {
      await accountsRepo.applyBalanceDelta(accountId, balanceAdjust)
    }

    const updated = await transactionsRepo.update(id, patch)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'transaction',
      entityId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[transactions PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui transaksi'), { status: 500 })
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
    const existing = await transactionsRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Transaksi tidak ditemukan'), { status: 404 })
    }

    // Revert the balance effect of this transaction
    const delta = computeBalanceDelta(existing.type, parseInt(existing.amount, 10) || 0)
    await accountsRepo.applyBalanceDelta(existing.account_id, -delta)

    await transactionsRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'transaction',
      entityId: id,
      before: existing,
    })

    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[transactions DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus transaksi'), { status: 500 })
  }
}
