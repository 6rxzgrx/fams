import { NextResponse } from 'next/server'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { priceRatesRepo } from '@/integrations/sheets/repositories/price-rates'
import { UpdateAssetSchema, ok, fail } from '@/domain/types'
import { computeValueIdr } from '@/domain/rates'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { getSessionMember } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'assets')) {
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
    if (!existing || existing.kind !== 'non_liquid') {
      return NextResponse.json(fail('Aset tidak ditemukan'), { status: 404 })
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) patch.name = parsed.data.name
    if (parsed.data.type !== undefined) patch.type = parsed.data.type
    if (parsed.data.current_balance !== undefined) patch.current_balance = String(parsed.data.current_balance)
    if (parsed.data.satuan !== undefined) patch.satuan = parsed.data.satuan
    if (parsed.data.currency !== undefined) patch.currency = parsed.data.currency
    if (parsed.data.include_in_saldo !== undefined) patch.include_in_saldo = parsed.data.include_in_saldo ? 'true' : 'false'
    if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes
    if (parsed.data.icon !== undefined) patch.icon = parsed.data.icon
    if (parsed.data.color !== undefined) patch.color = parsed.data.color
    if (parsed.data.price_symbol !== undefined) patch.price_symbol = parsed.data.price_symbol

    // Recompute value_idr whenever balance, satuan, or price_symbol may have changed
    const effectiveBalance = parsed.data.current_balance ?? (parseFloat(existing.current_balance) || 0)
    const effectiveSatuan = (parsed.data.satuan ?? existing.satuan) || 'rupiah'
    const effectiveSymbol = (parsed.data.price_symbol ?? existing.price_symbol) || ''
    const rates = await priceRatesRepo.findAll()
    patch.value_idr = computeValueIdr(
      typeof effectiveBalance === 'number' ? effectiveBalance : parseFloat(String(effectiveBalance)) || 0,
      effectiveSatuan,
      effectiveSymbol,
      rates,
    )

    const updated = await assetsRepo.update(id, patch)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'asset',
      entityId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[assets PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui aset'), { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { id } = await params

  try {
    const existing = await assetsRepo.findById(id)
    if (!existing || existing.kind !== 'non_liquid') {
      return NextResponse.json(fail('Aset tidak ditemukan'), { status: 404 })
    }

    await assetsRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'asset',
      entityId: id,
      before: existing,
    })

    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[assets DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus aset'), { status: 500 })
  }
}
