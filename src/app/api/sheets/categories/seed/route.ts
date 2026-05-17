import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { ok, fail } from '@/domain/types'
import { canWrite } from '@/domain/permissions'
import { generateId } from '@/lib/ulid'
import { writeAudit } from '@/lib/audit'
import { getSessionMember } from '@/lib/api-helpers'

// ─── Seed data ────────────────────────────────────────────────────────────────
// Shape: { name, color, budget_type, children? }

type SeedNode = { name: string; color?: string; budget_type?: string; children?: string[] }

const EXPENSE_SEEDS: SeedNode[] = [
  { name: 'Belanja', color: '#f59e0b', budget_type: 'wants', children: ['Baju', 'Belanja Online', 'Gadget/Elektronik', 'Groceries', 'Belum Terkategori'] },
  { name: 'Hiburan', color: '#a855f7', budget_type: 'wants' },
  { name: 'Hutang Piutang', color: '#ef4444', budget_type: 'needs', children: ['Bayar Hutang', 'Beri Pinjaman'] },
  { name: 'Investasi', color: '#10b981', budget_type: 'savings', children: ['Emas', 'Reksadana', 'Saham', 'Tabungan'] },
  { name: 'Keluarga', color: '#f97316', budget_type: 'wants' },
  { name: 'Kesehatan', color: '#06b6d4', budget_type: 'needs' },
  { name: 'Lain-lain', color: '#94a3b8', budget_type: 'wants' },
  { name: 'Makan dan Minum', color: '#f43f5e', budget_type: 'needs', children: ['Jajan', 'Online Delivery', 'Restoran'] },
  { name: 'Pekerjaan', color: '#3b82f6', budget_type: 'needs' },
  { name: 'Pendidikan', color: '#8b5cf6', budget_type: 'needs' },
  { name: 'Pinjaman', color: '#dc2626', budget_type: 'needs', children: ['Cicilan Mobil', 'Cicilan Rumah', 'Hutang'] },
  { name: 'Sedekah', color: '#16a34a', budget_type: 'sedekah', children: ['Infaq', 'Sumbangan', 'Zakat'] },
  { name: 'Tagihan', color: '#0ea5e9', budget_type: 'needs', children: ['Air', 'Gas', 'Internet', 'Kartu Kredit', 'Listrik', 'Pulsa dan Paket Data', 'TV Kabel'] },
  { name: 'Transportasi', color: '#64748b', budget_type: 'needs', children: ['Bensin', 'Parkir', 'Taxi/Ojol'] },
]

const INCOME_SEEDS: SeedNode[] = [
  { name: 'Bisnis', color: '#10b981' },
  { name: 'Bonus', color: '#f59e0b' },
  { name: 'Gaji', color: '#3b82f6' },
  { name: 'Hutang Piutang', color: '#ef4444', children: ['Pinjam Uang', 'Piutang Dibayar'] },
  { name: 'Investasi', color: '#8b5cf6' },
  { name: 'Lain-lain', color: '#94a3b8' },
  { name: 'Pemberian', color: '#f97316' },
  { name: 'Penjualan', color: '#06b6d4' },
  { name: 'Pinjaman', color: '#dc2626' },
]

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST() {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  try {
    const existing = await categoriesRepo.findAll()
    if (existing.length > 0) {
      return NextResponse.json(
        fail('Kategori sudah ada. Hapus semua kategori terlebih dahulu sebelum memuat ulang data default.'),
        { status: 409 },
      )
    }

    const now = new Date().toISOString()
    const created: Array<{ id: string; name: string }> = []

    async function seedGroup(seeds: SeedNode[], type: 'expense' | 'income') {
      for (const node of seeds) {
        const parentId = generateId('category')
        const budgetType = type === 'expense' ? (node.budget_type ?? '') : ''
        await categoriesRepo.create({
          id: parentId,
          name: node.name,
          type,
          icon: 'tag',
          color: node.color ?? '#64748b',
          parent_id: '',
          budget_type: budgetType,
          is_system: 'true',
          created_at: now,
          updated_at: now,
          deleted_at: '',
        })
        created.push({ id: parentId, name: node.name })

        for (const childName of node.children ?? []) {
          const childId = generateId('category')
          await categoriesRepo.create({
            id: childId,
            name: childName,
            type,
            icon: 'tag',
            color: node.color ?? '#64748b',
            parent_id: parentId,
            budget_type: budgetType,
            is_system: 'true',
            created_at: now,
            updated_at: now,
            deleted_at: '',
          })
          created.push({ id: childId, name: childName })
        }
      }
    }

    await seedGroup(EXPENSE_SEEDS, 'expense')
    await seedGroup(INCOME_SEEDS, 'income')

    await writeAudit({
      memberId: member.id,
      memberName: member.name,
      action: 'create',
      entityType: 'transaction_category',
      entityId: 'seed',
      after: { count: created.length },
    })

    revalidateTag('transaction-categories', 'max')
    return NextResponse.json(ok({ seeded: created.length }), { status: 201 })
  } catch (err) {
    console.error('[categories/seed POST]', err)
    return NextResponse.json(fail('Gagal memuat kategori default'), { status: 500 })
  }
}
