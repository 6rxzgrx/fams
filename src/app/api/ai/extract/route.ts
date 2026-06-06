import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/auth'
import { env } from '@/lib/env'

type ExtractContext = {
  categories?: string[]
  accounts?: string[]
}

function buildPrompt(ctx: ExtractContext): string {
  const cats = (ctx.categories ?? []).filter(Boolean)
  const accs = (ctx.accounts ?? []).filter(Boolean)

  const categoryBlock = cats.length
    ? `\nKATEGORI YANG TERSEDIA (pilih category_hint PERSIS dari daftar ini bila cocok):\n${cats.map((c) => `- ${c}`).join('\n')}`
    : ''

  const accountBlock = accs.length
    ? `\nAKUN/METODE PEMBAYARAN YANG TERSEDIA (pilih account_hint PERSIS dari daftar ini bila terlihat di struk, mis. logo/teks "BCA", "GoPay", "tunai"):\n${accs.map((a) => `- ${a}`).join('\n')}`
    : ''

  return `Kamu adalah asisten ekstraksi data struk/tagihan. Analisis gambar ini dan ekstrak informasi transaksi.

Kembalikan HANYA JSON dengan format berikut (tanpa markdown, tanpa backtick):
{
  "type": "expense" | "income",
  "amount": <angka integer, tanpa desimal>,
  "description": "<deskripsi singkat item utama>",
  "date": "<YYYY-MM-DD, gunakan tanggal di struk atau hari ini jika tidak ada>",
  "merchant": "<nama toko/merchant jika ada>",
  "category_hint": "<kategori paling cocok>",
  "account_hint": "<nama akun/metode pembayaran paling cocok, atau string kosong>",
  "confidence": <0.0 sampai 1.0>,
  "notes": "<catatan tambahan jika ada, atau string kosong>"
}
${categoryBlock}
${accountBlock}

Aturan:
- amount selalu positif (integer, dalam rupiah)
- date format YYYY-MM-DD
- Untuk category_hint: jika ada daftar kategori di atas, WAJIB pilih salah satu yang paling cocok PERSIS seperti tertulis. Jika tidak ada yang cocok sama sekali, tebak jalur kategori umum (mis. "Makan dan Minum • Jajan").
- Untuk account_hint: hanya isi bila metode pembayaran terlihat jelas di struk; jika tidak, kosongkan.
- Jika tidak yakin, tetap isi dengan estimasi terbaik dan turunkan confidence
- Jika bukan struk/tagihan, kembalikan confidence: 0`
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  if (!env.GEMINI_API_KEY) {
    return NextResponse.json({ ok: false, error: 'Gemini API key tidak dikonfigurasi' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const {
      image,
      mimeType = 'image/jpeg',
      categories,
      accounts,
    } = body as {
      image: string
      mimeType?: string
      categories?: string[]
      accounts?: string[]
    }

    if (!image) {
      return NextResponse.json({ ok: false, error: 'Image diperlukan' }, { status: 400 })
    }

    // Cap context size to keep the prompt lean.
    const prompt = buildPrompt({
      categories: Array.isArray(categories) ? categories.slice(0, 80) : [],
      accounts: Array.isArray(accounts) ? accounts.slice(0, 30) : [],
    })

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      { inlineData: { mimeType, data: image } },
      { text: prompt },
    ])

    const text = result.response.text().trim()
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    const parsed = JSON.parse(cleaned)

    return NextResponse.json({ ok: true, data: parsed })
  } catch (err) {
    console.error('[ai/extract]', err)
    return NextResponse.json({ ok: false, error: 'Gagal mengekstrak data dari gambar' }, { status: 500 })
  }
}
