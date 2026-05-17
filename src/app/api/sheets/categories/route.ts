import { NextResponse } from 'next/server'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { CreateTransactionCategorySchema, ok, fail } from '@/domain/types'
import { validateCategoryHierarchy } from '@/domain/categories'
import { canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSessionMember } from '@/lib/api-helpers'
import { revalidateTag, unstable_cache } from 'next/cache'

const getCachedCategories = unstable_cache(
  async () => categoriesRepo.findAll(),
  ['transaction-categories'],
  { revalidate: 300, tags: ['transaction-categories'] }
)

export async function GET() {
  const { error } = await getSessionMember()
  if (error) return error

  try {
    const categories = await getCachedCategories()
    return NextResponse.json(ok(categories))
  } catch (err) {
    console.error('[categories GET]', err)
    return NextResponse.json(fail('Gagal memuat kategori'), { status: 500 })
  }
}

export async function POST(req: Request) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
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
    const parsed = CreateTransactionCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const categories = await categoriesRepo.findAll()
    const hierarchyError = validateCategoryHierarchy(categories, {
      type: parsed.data.type,
      parent_id: parsed.data.parent_id,
    })
    if (hierarchyError) {
      return NextResponse.json(fail(hierarchyError), { status: 400 })
    }

    // Children inherit budget_type from parent; root expense categories use form value
    let budgetType = parsed.data.budget_type ?? ''
    if (parsed.data.parent_id) {
      const parent = categories.find((c) => c.id === parsed.data.parent_id)
      budgetType = parent?.budget_type ?? ''
    }

    const now = new Date().toISOString()
    const category = await categoriesRepo.create({
      id: generateId('category'),
      name: parsed.data.name,
      type: parsed.data.type,
      icon: parsed.data.icon,
      color: parsed.data.color,
      parent_id: parsed.data.parent_id,
      budget_type: budgetType,
      is_system: 'false',
      created_at: now,
      updated_at: now,
      deleted_at: '',
    })

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'transaction_category',
      entityId: category.id,
      after: category,
    })

    revalidateTag('transaction-categories', 'max')
    return NextResponse.json(ok(category), { status: 201 })
  } catch (err) {
    console.error('[categories POST]', err)
    return NextResponse.json(fail('Gagal menyimpan kategori'), { status: 500 })
  }
}
