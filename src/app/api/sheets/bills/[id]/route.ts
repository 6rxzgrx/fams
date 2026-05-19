import { NextResponse } from 'next/server'
import { billsRepo } from '@/integrations/sheets/repositories/bills'
import { UpdateBillSchema, ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { getSessionMember } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'bills')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = UpdateBillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const existing = await billsRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Tagihan tidak ditemukan'), { status: 404 })
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) patch.name = parsed.data.name
    if (parsed.data.amount !== undefined) patch.amount = String(parsed.data.amount)
    if (parsed.data.due_date !== undefined) patch.due_date = parsed.data.due_date
    if (parsed.data.account_id !== undefined) patch.account_id = parsed.data.account_id
    if (parsed.data.category_id !== undefined) patch.category_id = parsed.data.category_id
    if (parsed.data.recurrence !== undefined) patch.recurrence = parsed.data.recurrence
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes

    const updated = await billsRepo.update(id, patch)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'bill',
      entityId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[bills PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui tagihan'), { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'bills')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const existing = await billsRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Tagihan tidak ditemukan'), { status: 404 })
    }

    await billsRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'bill',
      entityId: id,
      before: existing,
    })

    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[bills DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus tagihan'), { status: 500 })
  }
}
