import type { Context } from 'grammy'
import { accountsRepo } from '@/integrations/sheets/repositories/accounts'
import { formatMoney } from '@/lib/money'

const TYPE_ICONS: Record<string, string> = {
  cash: '💵',
  bank: '🏦',
  ewallet: '📱',
  loan: '📋',
  investment: '📈',
}

const TYPE_LABELS: Record<string, string> = {
  cash: 'Tunai',
  bank: 'Bank',
  ewallet: 'E-Wallet',
  loan: 'Pinjaman',
  investment: 'Investasi',
}

export async function saldoCommand(ctx: Context) {
  await ctx.replyWithChatAction('typing')

  try {
    const accounts = await accountsRepo.findAll()
    const active = accounts.filter(
      (a) => !a.deleted_at && a.include_in_saldo !== 'false',
    )

    if (active.length === 0) {
      return ctx.reply('Belum ada akun yang tercatat.')
    }

    const total = active.reduce(
      (sum, a) => sum + (parseInt(a.current_balance, 10) || 0),
      0,
    )

    const lines: string[] = ['*Saldo Akun*\n']

    for (const acc of active) {
      const icon = TYPE_ICONS[acc.type] ?? '💰'
      const balance = parseInt(acc.current_balance, 10) || 0
      lines.push(`${icon} ${acc.name}`)
      lines.push(`   ${formatMoney(balance)}`)
    }

    lines.push('')
    lines.push('———')
    lines.push(`*Total Saldo: ${formatMoney(total)}*`)

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' })
  } catch (err) {
    console.error('[bot/saldo]', err)
    return ctx.reply('Gagal memuat saldo. Pastikan koneksi Google Sheets aktif.')
  }
}
