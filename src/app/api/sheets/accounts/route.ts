import { NextResponse } from 'next/server'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { CreateAccountSchema, ok, fail } from '@/domain/types'
import { canRead, canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET() {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'accounts')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const accounts = await accountsRepo.findAll()
    return NextResponse.json(ok(accounts))
  } catch (err) {
    console.error('[accounts GET]', err)
    return NextResponse.json(fail('Gagal memuat akun'), { status: 500 })
  }
}

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'accounts')) {
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
    const parsed = CreateAccountSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const now = new Date().toISOString()
    const id = generateId('account')

    const account = await accountsRepo.create({
      id,
      name: parsed.data.name,
      type: parsed.data.type,
      currency: parsed.data.currency,
      current_balance: String(parsed.data.current_balance),
      bank_name: parsed.data.bank_name,
      account_number: parsed.data.account_number,
      color: parsed.data.color,
      icon: parsed.data.icon,
      notes: parsed.data.notes,
      created_by: member.id,
      created_at: now,
      updated_at: now,
      deleted_at: '',
      include_in_saldo: parsed.data.include_in_saldo ? 'true' : 'false',
    })

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'account',
      entityId: id,
      after: account,
    })

    return NextResponse.json(ok(account), { status: 201 })
  } catch (err) {
    console.error('[accounts POST]', err)
    return NextResponse.json(fail('Gagal menyimpan akun'), { status: 500 })
  }
}
