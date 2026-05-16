import { config } from 'dotenv'

// Must run before any module that reads process.env at load time
config({ path: '.env.local' })

async function main() {
  const { Bot } = await import('grammy')
  const { addTransactionCommand, handleTxCallback, handleTxMessage } = await import(
    './commands/add-transaction'
  )
  const { saldoCommand } = await import('./commands/saldo')
  const { anggaranCommand } = await import('./commands/anggaran')

  const missing: string[] = []
  if (!process.env.TELEGRAM_BOT_TOKEN) missing.push('TELEGRAM_BOT_TOKEN')
  if (!process.env.GOOGLE_SA_EMAIL) missing.push('GOOGLE_SA_EMAIL')
  if (!process.env.GOOGLE_SA_PRIVATE_KEY) missing.push('GOOGLE_SA_PRIVATE_KEY')
  if (!process.env.GOOGLE_SHEETS_ID) missing.push('GOOGLE_SHEETS_ID')

  if (missing.length > 0) {
    console.error('ERROR: env berikut belum diset di .env.local:')
    missing.forEach((k) => console.error(`  - ${k}`))
    process.exit(1)
  }

  const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

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
        '/start — Pesan selamat datang',
      { parse_mode: 'Markdown' }
    )
  )

  bot.command('catat', addTransactionCommand)
  bot.command('saldo', saldoCommand)
  bot.command('anggaran', anggaranCommand)

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

  bot.start()
  console.log('FAMS Bot berjalan... (polling mode)')
}

main()
