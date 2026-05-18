import { Bot, webhookCallback } from 'grammy'
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { addTransactionCommand, handleTxCallback, handleTxMessage } from '@bot/commands/add-transaction'
import { saldoCommand } from '@bot/commands/saldo'
import { anggaranCommand } from '@bot/commands/anggaran'
import { assetsCommand } from '@bot/commands/assets'

function buildBot() {
  if (!env.TELEGRAM_BOT_TOKEN) return null

  const bot = new Bot(env.TELEGRAM_BOT_TOKEN)

  // ─── Logging middleware ────────────────────────────────────────────────────
  bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id
    const from = ctx.from?.username ?? ctx.from?.first_name ?? '?'

    if (ctx.message) {
      const text = ctx.message.text ?? '(non-text)'
      console.log(`[bot] message from=${from} chatId=${chatId} text="${text}"`)
    } else if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data ?? '?'
      console.log(`[bot] callback_query from=${from} chatId=${chatId} data="${data}"`)
    } else {
      console.log(`[bot] update from=${from} chatId=${chatId}`)
    }

    await next()
  })

  // ─── Commands ──────────────────────────────────────────────────────────────
  bot.command('start', (ctx) =>
    ctx.reply(
      '*FAMS Bot*\n\nPerintah tersedia:\n/catat — Tambah transaksi\n/saldo — Lihat saldo akun\n/anggaran — Lihat anggaran bulan ini\n/help — Bantuan',
      { parse_mode: 'Markdown' }
    )
  )

  bot.command('help', (ctx) =>
    ctx.reply(
      '*Perintah FAMS Bot*\n\n' +
        '/catat — Tambah transaksi baru\n' +
        '/saldo — Lihat saldo semua akun\n' +
        '/anggaran — Lihat sisa anggaran bulan ini\n' +
        '/assets — Tampilkan semua aset keluarga\n' +
        '/start — Pesan selamat datang',
      { parse_mode: 'Markdown' }
    )
  )

  bot.command('catat', addTransactionCommand)
  bot.command('saldo', saldoCommand)
  bot.command('anggaran', anggaranCommand)
  bot.command('assets', assetsCommand)

  // ─── Inline keyboard callbacks ─────────────────────────────────────────────
  bot.on('callback_query:data', async (ctx) => {
    try {
      await handleTxCallback(ctx)
    } catch (err) {
      console.error('[bot] callback_query error:', err)
      try {
        await ctx.answerCallbackQuery('Terjadi kesalahan.')
      } catch {}
    }
  })

  // ─── Text messages (intercept mid-conversation) ────────────────────────────
  bot.on('message:text', async (ctx) => {
    // Skip commands — they are handled above
    if (ctx.message.text.startsWith('/')) return
    try {
      await handleTxMessage(ctx)
    } catch (err) {
      console.error('[bot] message:text error:', err)
      await ctx.reply('Terjadi kesalahan. Ketik /catat untuk mulai lagi.')
    }
  })

  // ─── Global error handler ──────────────────────────────────────────────────
  bot.catch((err) => {
    console.error('[bot] unhandled error:', err.error)
    console.error('[bot] update that caused it:', JSON.stringify(err.ctx.update))
  })

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
