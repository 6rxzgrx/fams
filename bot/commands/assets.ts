import type { Context } from 'grammy'
import { assetsRepo } from '@/integrations/sheets/repositories/assets'
import { formatMoney } from '@/lib/money'
import type { Asset } from '@/domain/types'

const TYPE_LABELS: Record<string, string> = {
  investment: 'Investasi',
  precious_metal: 'Logam Mulia',
  stocks: 'Saham',
  crypto: 'Kripto',
  real_asset: 'Aset Nyata',
  business: 'Bisnis',
}

const TYPE_ICONS: Record<string, string> = {
  investment: '📈',
  precious_metal: '🥇',
  stocks: '📊',
  crypto: '₿',
  real_asset: '🏠',
  business: '💼',
}

export async function assetsCommand(ctx: Context) {
  await ctx.replyWithChatAction('typing')

  try {
    const all = await assetsRepo.findAll()
    const nonLiquid = all.filter((a) => a.kind === 'non_liquid')

    if (nonLiquid.length === 0) {
      return ctx.reply('Belum ada aset yang tercatat.')
    }

    const total = nonLiquid.reduce((sum, a) => sum + (parseFloat(a.current_balance) || 0), 0)

    // Group by type
    const grouped = nonLiquid.reduce<Record<string, Asset[]>>((acc, asset) => {
      const type = asset.type ?? 'other'
      if (!acc[type]) acc[type] = []
      acc[type].push(asset)
      return acc
    }, {})

    const lines: string[] = ['*Daftar Aset FAMS*\n']

    for (const [type, items] of Object.entries(grouped)) {
      const icon = TYPE_ICONS[type] ?? '📦'
      const label = TYPE_LABELS[type] ?? type
      lines.push(`${icon} *${label}*`)
      for (const item of items) {
        const value = formatMoney(parseFloat(item.current_balance) || 0)
        const note = item.notes ? ` _(${item.notes})_` : ''
        lines.push(`  • ${item.name} — ${value}${note}`)
      }
      lines.push('')
    }

    lines.push(`———`)
    lines.push(`*Total: ${formatMoney(total)}*`)
    lines.push(`_${nonLiquid.length} aset tercatat_`)

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' })
  } catch (err) {
    console.error('[bot/assets]', err)
    return ctx.reply('Gagal memuat aset. Pastikan koneksi Google Sheets aktif.')
  }
}
