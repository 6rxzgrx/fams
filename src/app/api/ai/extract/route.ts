import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/auth'
import { env } from '@/lib/env'

const EXTRACTION_PROMPT = `Kamu adalah asisten ekstraksi data struk/tagihan. Analisis gambar ini dan ekstrak informasi transaksi.

Kembalikan HANYA JSON dengan format berikut (tanpa markdown, tanpa backtick):
{
  "type": "expense" | "income",
  "amount": <angka integer, tanpa desimal>,
  "description": "<deskripsi singkat item utama>",
  "date": "<YYYY-MM-DD, gunakan tanggal di struk atau hari ini jika tidak ada>",
  "merchant": "<nama toko/merchant jika ada>",
  "category_hint": "<kategori atau jalur kategori yang paling cocok, contoh: Gaji, Hiburan, Tagihan • Air, Makan dan Minum • Jajan, Transportasi • Bensin>",
  "confidence": <0.0 sampai 1.0>,
  "notes": "<catatan tambahan jika ada, atau string kosong>"
}

Aturan:
- amount selalu positif (integer, dalam rupiah)
- date format YYYY-MM-DD
- Jika tidak yakin, tetap isi dengan estimasi terbaik dan turunkan confidence
- Jika bukan struk/tagihan, kembalikan confidence: 0`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  if (!env.GEMINI_API_KEY) {
    return NextResponse.json({ ok: false, error: 'Gemini API key tidak dikonfigurasi' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { image, mimeType = 'image/jpeg' } = body as { image: string; mimeType?: string }

    if (!image) {
      return NextResponse.json({ ok: false, error: 'Image diperlukan' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { inlineData: { mimeType, data: image } },
      { text: EXTRACTION_PROMPT },
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
