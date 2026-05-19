import { NextResponse } from 'next/server'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions'
import { UpdateAssetSchema, ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { getSessionMember } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'accounts')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = UpdateAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const existing = await assetsRepo.findById(id)
    if (!existing || existing.kind !== 'liquid') {
      return NextResponse.json(fail('Akun tidak ditemukan'), { status: 404 })
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) patch.name = parsed.data.name
    if (parsed.data.type !== undefined) patch.type = parsed.data.type
    if (parsed.data.currency !== undefined) patch.currency = parsed.data.currency
    if (parsed.data.current_balance !== undefined) patch.current_balance = String(parsed.data.current_balance)
    if (parsed.data.bank_name !== undefined) patch.bank_name = parsed.data.bank_name
    if (parsed.data.account_number !== undefined) patch.account_number = parsed.data.account_number
    if (parsed.data.color !== undefined) patch.color = parsed.data.color
    if (parsed.data.icon !== undefined) patch.icon = parsed.data.icon
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes
    if (parsed.data.include_in_saldo !== undefined) patch.include_in_saldo = parsed.data.include_in_saldo ? 'true' : 'false'

    const updated = await assetsRepo.update(id, patch)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'account',
      entityId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[accounts PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui akun'), { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'accounts')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const existing = await assetsRepo.findById(id)
    if (!existing || existing.kind !== 'liquid') {
      return NextResponse.json(fail('Akun tidak ditemukan'), { status: 404 })
    }

    const linked = await transactionsRepo.findByField('account_id', id)
    if (linked.length > 0) {
      return NextResponse.json(
        fail(`Akun masih dipakai di ${linked.length} transaksi. Pindahkan atau hapus transaksi dulu.`),
        { status: 409 },
      )
    }

    await assetsRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'account',
      entityId: id,
      before: existing,
    })

    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[accounts DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus akun'), { status: 500 })
  }
}
