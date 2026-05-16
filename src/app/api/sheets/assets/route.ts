import { NextResponse } from 'next/server'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { CreateAssetSchema, ok, fail } from '@/domain/types'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET() {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'assets')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const assets = await assetsRepo.findAll()
    return NextResponse.json(ok(assets))
  } catch (err) {
    console.error('[assets GET]', err)
    return NextResponse.json(fail('Gagal memuat aset'), { status: 500 })
  }
}

export async function POST(req: Request) {
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

  try {
    const body = await req.json()
    const parsed = CreateAssetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const now = new Date().toISOString()
    const id = generateId('asset')

    const asset = await assetsRepo.create({
      id,
      name: parsed.data.name,
      type: parsed.data.type,
      value: String(parsed.data.value),
      currency: parsed.data.currency,
      account_id: parsed.data.account_id,
      include_in_saldo: parsed.data.include_in_saldo ? 'true' : 'false',
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
      entityType: 'asset',
      entityId: id,
      after: asset,
    })

    return NextResponse.json(ok(asset), { status: 201 })
  } catch (err) {
    console.error('[assets POST]', err)
    return NextResponse.json(fail('Gagal menyimpan aset'), { status: 500 })
  }
}
