import { NextResponse } from 'next/server'
import { priceRatesRepo } from '@/integrations/sheets/repositories/price-rates'
import { UpdatePriceRateSchema, ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'assets')) {
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
    const existing = await priceRatesRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Rate tidak ditemukan'), { status: 404 })
    }
    if (existing.source === 'api') {
      return NextResponse.json(fail('Rate otomatis tidak dapat diedit'), { status: 403 })
    }

    const body = await req.json()
    const parsed = UpdatePriceRateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const patch: Record<string, unknown> = {}
    if (parsed.data.label !== undefined) patch.label = parsed.data.label
    if (parsed.data.unit !== undefined) patch.unit = parsed.data.unit
    if (parsed.data.value_idr_per_unit !== undefined) {
      patch.value_idr_per_unit = String(parsed.data.value_idr_per_unit)
    }

    const updated = await priceRatesRepo.update(id, patch)
    if (!updated) {
      return NextResponse.json(fail('Gagal memperbarui rate'), { status: 500 })
    }

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'update',
      entityType: 'price_rate',
      entityId: id,
      before: existing,
      after: updated,
    })

    return NextResponse.json(ok(updated))
  } catch (err) {
    console.error('[price-rates PATCH]', err)
    return NextResponse.json(fail('Gagal memperbarui rate'), { status: 500 })
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
    const existing = await priceRatesRepo.findById(id)
    if (!existing) {
      return NextResponse.json(fail('Rate tidak ditemukan'), { status: 404 })
    }
    if (existing.source === 'api') {
      return NextResponse.json(fail('Rate otomatis tidak dapat dihapus'), { status: 403 })
    }

    await priceRatesRepo.softDelete(id)

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'delete',
      entityType: 'price_rate',
      entityId: id,
      before: existing,
    })

    return NextResponse.json(ok({ id }))
  } catch (err) {
    console.error('[price-rates DELETE]', err)
    return NextResponse.json(fail('Gagal menghapus rate'), { status: 500 })
  }
}
