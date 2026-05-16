import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { budgetsRepo } from '@/integrations/sheets/repositories/budgets'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions'
import { UpdateTransactionCategorySchema, ok, fail } from '@/domain/types'
import { getCategoryChildren, validateCategoryHierarchy } from '@/domain/categories'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { getSessionMember } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = UpdateTransactionCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const existing = await categoriesRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Kategori tidak ditemukan'), { status: 404 })
    }

    const categories = await categoriesRepo.findAll()
    const nextType = parsed.data.type ?? existing.type
    const nextParentId = parsed.data.parent_id ?? existing.parent_id
    const hierarchyError = validateCategoryHierarchy(
      categories,
      { type: nextType, parent_id: nextParentId },
      existing.id,
    )
    if (hierarchyError) {
      return NextResponse.json(fail(hierarchyError), { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) patch.name = parsed.data.name
    if (parsed.data.type !== undefined) patch.type = parsed.data.type
    if (parsed.data.icon !== undefined) patch.icon = parsed.data.icon
    if (parsed.data.color !== undefined) patch.color = parsed.data.color
    if (parsed.data.parent_id !== undefined) patch.parent_id = parsed.data.parent_id

    const updated = await categoriesRepo.update(id, patch)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'transaction_category',
      entityId: id,
      before: existing,
      after: updated,
    })

    revalidateTag('transaction-categories', 'max')
    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[categories PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui kategori'), { status: 500 })
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
    const existing = await categoriesRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Kategori tidak ditemukan'), { status: 404 })
    }

    const childCategories = getCategoryChildren(await categoriesRepo.findAll(), id)
    if (childCategories.length > 0) {
      return NextResponse.json(
        fail(`Kategori ini masih punya ${childCategories.length} turunan.`),
        { status: 409 },
      )
    }

    const linkedTransactions = await transactionsRepo.findByField('category_id', id)
    if (linkedTransactions.length > 0) {
      return NextResponse.json(
        fail(`Kategori masih dipakai di ${linkedTransactions.length} transaksi.`),
        { status: 409 },
      )
    }

    const linkedBudgets = await budgetsRepo.findByField('category_id', id)
    if (linkedBudgets.length > 0) {
      return NextResponse.json(
        fail(`Kategori masih dipakai di ${linkedBudgets.length} anggaran.`),
        { status: 409 },
      )
    }

    await categoriesRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'transaction_category',
      entityId: id,
      before: existing,
    })

    revalidateTag('transaction-categories', 'max')
    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[categories DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus kategori'), { status: 500 })
  }
}
