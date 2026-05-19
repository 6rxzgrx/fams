import { NextResponse } from 'next/server'
import { billPaymentsRepo } from '@/integrations/sheets/repositories/bill-payments'
import { ok, fail } from '@/domain/types'
import { canRead } from '@/domain/permissions'
import { getSessionMember } from '@/lib/api-helpers'

export async function GET(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canRead(member, 'bills')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM

  try {
    const payments = month
      ? await billPaymentsRepo.findByMonth(month)
      : await billPaymentsRepo.findAll()
    return NextResponse.json(ok(payments))
  } catch (err) {
    console.error('[bill-payments GET]', err)
    return NextResponse.json(fail('Gagal memuat pembayaran'), { status: 500 })
  }
}
