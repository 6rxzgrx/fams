import { Bot, webhookCallback } from 'grammy'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { assetsCommand } from '../../../../../bot/commands/assets'

function buildBot() {
  if (!env.TELEGRAM_BOT_TOKEN) return null

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  bot.command('start', (ctx) =>
    ctx.reply(
      'Halo! Selamat datang di *FAMS Bot*.\n\nPerintah tersedia:\n/assets — Lihat semua aset\n/help — Bantuan',
      { parse_mode: 'Markdown' }
    )
  )
  bot.command('help', (ctx) =>
    ctx.reply(
      '*Perintah FAMS Bot*\n\n/assets — Tampilkan semua aset keluarga\n/start — Pesan selamat datang',
      { parse_mode: 'Markdown' }
    )
  )
  bot.command('assets', assetsCommand)

  return bot
}

// Module-level singleton — reused across warm serverless invocations
const bot = buildBot()
const handleUpdate = bot ? webhookCallback(bot, 'std/http') : null

export async function POST(req: NextRequest) {
  if (!handleUpdate) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 })
  }

  // Verify secret token if set
  const secret = req.headers.get('x-telegram-bot-api-secret-token')
  if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  return handleUpdate(req)
}
