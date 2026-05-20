import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { getSessionMember } from '@/lib/api-helpers'
import { canWrite } from '@/domain/permissions'
import { checkRateLimit } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { ok, fail } from '@/domain/types'
import { aiInsightsRepo } from '@/integrations/sheets/repositories/ai-insights'

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await getSessionMember()
  if (error) return error

  const month = new URL(req.url).searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(fail('Parameter month tidak valid (YYYY-MM)'), { status: 400 })
  }

  try {
    const row = await aiInsightsRepo.findByMonth(month)
    return NextResponse.json(ok({
      month,
      insight: row?.insight ?? '',
      generated_at: row?.generated_at ?? '',
    }))
  } catch (err) {
    console.error('[report-insight GET]', err)
    return NextResponse.json(fail('Gagal memuat insight'), { status: 500 })
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
const CategorySchema = z.object({ name: z.string(), amount: z.number() })

const SummarySchema = z.object({
  month_label: z.string(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
  savings_rate: z.number(),
  transaction_count: z.number(),
  top_expense_categories: z.array(CategorySchema).max(10),
  biggest_expense_day: z.object({ date: z.string(), amount: z.number() }).nullable(),
  spending_streak: z.number(),
  trend: z.array(z.object({ label: z.string(), income: z.number(), expense: z.number() })).max(12),
})

const PostSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  summary: SummarySchema,
})

function buildPrompt(s: z.infer<typeof SummarySchema>): string {
  const trendText = s.trend
    .map((t) => `${t.label}: pemasukan ${t.income.toLocaleString('id-ID')}, pengeluaran ${t.expense.toLocaleString('id-ID')}`)
    .join('\n')

  const topCats = s.top_expense_categories
    .map((c) => `- ${c.name}: Rp ${c.amount.toLocaleString('id-ID')}`)
    .join('\n')

  const avgExpense = s.trend.length > 0
    ? Math.round(s.trend.reduce((sum, t) => sum + t.expense, 0) / s.trend.length)
    : 0

  const vsAvg = avgExpense > 0
    ? Math.round(((s.expense - avgExpense) / avgExpense) * 100)
    : 0

  return `Kamu adalah analis keuangan keluarga. Berikan insight keuangan yang jujur, personal, dan actionable dalam Bahasa Indonesia.

DATA KEUANGAN BULAN ${s.month_label.toUpperCase()}:
- Pemasukan: Rp ${s.income.toLocaleString('id-ID')}
- Pengeluaran: Rp ${s.expense.toLocaleString('id-ID')}
- Net (tabungan): Rp ${s.net.toLocaleString('id-ID')} (${s.net >= 0 ? 'surplus' : 'defisit'})
- Savings rate: ${s.savings_rate}%
- Total transaksi: ${s.transaction_count}
- Pengeluaran vs rata-rata 12 bulan: ${vsAvg > 0 ? '+' : ''}${vsAvg}%
${s.biggest_expense_day ? `- Hari terboros: ${s.biggest_expense_day.date} (Rp ${s.biggest_expense_day.amount.toLocaleString('id-ID')})` : ''}
${s.spending_streak > 0 ? `- Streak belanja berturut-turut: ${s.spending_streak} hari` : ''}

TOP KATEGORI PENGELUARAN:
${topCats || '(tidak ada data)'}

TREN 12 BULAN TERAKHIR:
${trendText}

Tulis response dengan format TEPAT seperti ini (tanpa markdown, tanpa header lain):
RINGKASAN:
[1 paragraf singkat (2-3 kalimat) menggambarkan kondisi keuangan bulan ini secara keseluruhan]

REKOMENDASI:
• [rekomendasi 1]
• [rekomendasi 2]
• [rekomendasi 3]
• [rekomendasi 4 jika relevan]

Gunakan nada ramah dan spesifik. Sebutkan angka konkret. Jangan gunakan kata "Anda", gunakan "kamu".`
}

export async function POST(req: NextRequest) {
  const { member, error } = await getSessionMember()
  if (error) return error

  if (!canWrite(member, 'transactions')) {
    return NextResponse.json(fail('Tidak punya akses'), { status: 403 })
  }

  if (!env.GEMINI_API_KEY) {
    return NextResponse.json(fail('Gemini API key tidak dikonfigurasi'), { status: 503 })
  }

  const rl = checkRateLimit(member.id, 'ai')
  if (!rl.ok) {
    return NextResponse.json(fail('Terlalu banyak permintaan AI. Coba lagi nanti.'), {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    })
  }

  try {
    const body = await req.json()
    const parsed = PostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(fail(parsed.error.issues[0].message), { status: 400 })
    }

    const { month, summary } = parsed.data
    const prompt = buildPrompt(summary)

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const insight = result.response.text().trim()

    const generated_at = new Date().toISOString()
    await aiInsightsRepo.upsert(month, {
      month,
      insight,
      model: 'gemini-2.5-flash',
      generated_by: member.id,
      generated_at,
    })

    return NextResponse.json(ok({ month, insight, generated_at }))
  } catch (err) {
    console.error('[report-insight POST]', err)
    return NextResponse.json(fail('Gagal menghasilkan insight'), { status: 500 })
  }
}
