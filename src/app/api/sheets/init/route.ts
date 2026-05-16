import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSheetsClient } from '@/integrations/sheets/client'
import { COLUMNS, TABS, columnToLetter } from '@/integrations/sheets/schema'
import { familyMembersRepo } from '@/integrations/sheets/repositories/family-members'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { settingsRepo } from '@/integrations/sheets/repositories/settings'
import { generateId } from '@/lib/ulid'
import { DEFAULT_CATEGORIES } from '@/domain/constants'
import { ok, fail } from '@/domain/types'
import { env } from '@/lib/env'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json(fail('Unauthorized'), { status: 401 })
  }

  if (!env.GOOGLE_SHEETS_ID) {
    return NextResponse.json(
      fail('GOOGLE_SHEETS_ID belum diisi di environment. Buat Google Sheet manual, share ke service account, lalu salin ID-nya ke .env.local'),
      { status: 400 },
    )
  }

  try {
    const body = await req.json()
    const { familyName, memberName } = body as { familyName: string; memberName: string }

    if (!familyName || !memberName) {
      return NextResponse.json(fail('familyName dan memberName wajib diisi'), { status: 400 })
    }

    const sheets = await getSheetsClient()
    const spreadsheetId = env.GOOGLE_SHEETS_ID

    // 1. Verify SA can access the spreadsheet
    let meta
    try {
      meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' })
    } catch (err) {
      const code = (err as { code?: number }).code
      if (code === 403 || code === 404) {
        return NextResponse.json(
          fail(`Service account tidak punya akses ke spreadsheet ini. Share ke ${env.GOOGLE_SA_EMAIL} sebagai Editor.`),
          { status: 403 },
        )
      }
      throw err
    }

    // 2. Add any missing tabs
    const existing = new Set((meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean) as string[])
    const required = Object.values(TABS)
    const toAdd = required.filter((tab) => !existing.has(tab))

    if (toAdd.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: toAdd.map((title) => ({ addSheet: { properties: { title } } })),
        },
      })
    }

    // 3. Write column headers (idempotent — row 1 is always headers)
    const headerData = Object.entries(COLUMNS).map(([tab, cols]) => ({
      range: `${tab}!A1:${columnToLetter(cols.length - 1)}1`,
      values: [cols],
    }))

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data: headerData },
    })

    // 4. Check if already initialized for this user (idempotency)
    const existingMembers = await familyMembersRepo.findByField('email', session.user.email)
    if (existingMembers.length > 0) {
      const member = existingMembers[0] as { id: string }
      await settingsRepo.set('family_name', familyName)
      return NextResponse.json(ok({ spreadsheetId, memberId: member.id, alreadyInitialized: true }))
    }

    const now = new Date().toISOString()

    // 5. Seed admin family member
    const memberId = generateId('member')
    await familyMembersRepo.create({
      id: memberId,
      email: session.user.email,
      name: memberName,
      role: 'admin',
      avatar_url: session.user.image ?? '',
      module_access: JSON.stringify({
        transactions: true, bills: true, assets: true,
        accounts: true, reminders: true, settings: true,
      }),
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    // 6. Seed default cash account
    await accountsRepo.create({
      id: generateId('account'),
      name: 'Kas',
      type: 'cash',
      currency: 'IDR',
      current_balance: '0',
      bank_name: '',
      account_number: '',
      color: '#059669',
      icon: 'wallet',
      notes: 'Akun kas default',
      created_by: memberId,
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    // 7. Seed default categories
    const categoryIds = new Map<string, string>()
    for (const cat of DEFAULT_CATEGORIES) {
      const id = generateId('category')
      const parentId = cat.parent_key ? categoryIds.get(cat.parent_key) : ''
      if (cat.parent_key && !parentId) {
        throw new Error(`Default category parent tidak ditemukan: ${cat.parent_key}`)
      }

      await categoriesRepo.create({
        id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        parent_id: parentId ?? '',
        is_system: 'true',
        created_at: now,
        updated_at: now,
        deleted_at: '',
      })

      categoryIds.set(cat.key, id)
    }

    await settingsRepo.set('family_name', familyName)
    await settingsRepo.set('timezone', 'Asia/Jakarta')
    await settingsRepo.set('schema_version', '1')

    return NextResponse.json(ok({ spreadsheetId, memberId, alreadyInitialized: false }))
  } catch (err) {
    console.error('[init]', err)
    const msg = err instanceof Error ? err.message : 'Gagal menginisialisasi spreadsheet'
    return NextResponse.json(fail(msg), { status: 500 })
  }
}
