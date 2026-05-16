import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

// GET /api/telegram/setup
// Call this once after deploying to register the webhook URL with Telegram.
export async function GET(req: NextRequest) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 })
  }

  const host = req.headers.get('host')
  const protocol = host?.startsWith('localhost') ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/telegram/webhook`

  const body: Record<string, string> = { url: webhookUrl }
  if (env.TELEGRAM_WEBHOOK_SECRET) body.secret_token = env.TELEGRAM_WEBHOOK_SECRET

  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()
  return NextResponse.json({ webhookUrl, telegram: data })
}
