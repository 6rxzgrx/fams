import type { Context } from 'grammy'
import { budgetsRepo } from '@/integrations/sheets/repositories/budgets'
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions'
import { categoriesRepo } from '@/integrations/sheets/repositories/transaction-categories'
import { formatMoney } from '@/lib/money'

export async function anggaranCommand(ctx: Context) {
  await ctx.replyWithChatAction('typing')

  try {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const firstDay = `${month}-01`
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)

    const [budgets, transactions, categories] = await Promise.all([
      budgetsRepo.findByMonth(month),
      transactionsRepo.findByDateRange(firstDay, lastDay),
      categoriesRepo.findAll(),
    ])

    const activeBudgets = budgets.filter((b) => !b.deleted_at)

    if (activeBudgets.length === 0) {
      return ctx.reply('Belum ada anggaran untuk bulan ini.')
    }

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

    // Only count expense transactions this month
    const expenses = transactions.filter((t) => t.type === 'expense' && !t.deleted_at)

    // Spent per category_id
    const spentByCategory = new Map<string, number>()
    for (const tx of expenses) {
      const catId = tx.category_id ?? ''
      spentByCategory.set(catId, (spentByCategory.get(catId) ?? 0) + (parseInt(tx.amount, 10) || 0))
    }

    // Separate total budget (category_id = '') from per-category budgets
    const totalBudgetRow = activeBudgets.find((b) => !b.category_id)
    const categoryBudgets = activeBudgets.filter((b) => !!b.category_id)

    const totalSpent = expenses.reduce((sum, t) => sum + (parseInt(t.amount, 10) || 0), 0)

    const monthLabel = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    const lines: string[] = [`*Anggaran ${monthLabel}*\n`]

    // Total line
    if (totalBudgetRow) {
      const allocated = parseInt(totalBudgetRow.allocated_amount, 10) || 0
      const remaining = allocated - totalSpent
      const status = remaining < 0 ? '🔴' : remaining < allocated * 0.2 ? '🟡' : '🟢'
      lines.push(`${status} *Total Anggaran*`)
      lines.push(`   Anggaran: ${formatMoney(allocated)}`)
      lines.push(`   Terpakai: ${formatMoney(totalSpent)}`)
      lines.push(`   Sisa: *${formatMoney(remaining)}*`)
      lines.push('')
    } else {
      lines.push(`Total pengeluaran bulan ini: ${formatMoney(totalSpent)}\n`)
    }

    // Per-category lines
    if (categoryBudgets.length > 0) {
      lines.push('*Per Kategori:*')
      for (const budget of categoryBudgets) {
        const allocated = parseInt(budget.allocated_amount, 10) || 0
        const spent = spentByCategory.get(budget.category_id) ?? 0
        const remaining = allocated - spent
        const catName = categoryMap.get(budget.category_id) ?? budget.category_id
        const status = remaining < 0 ? '🔴' : remaining < allocated * 0.2 ? '🟡' : '🟢'
        lines.push(`${status} ${catName}: sisa *${formatMoney(remaining)}* dari ${formatMoney(allocated)}`)
      }
    }

    return ctx.reply(lines.join('\n'), { parse_mode: 'Markdown' })
  } catch (err) {
    console.error('[bot/anggaran]', err)
    return ctx.reply('Gagal memuat anggaran. Pastikan koneksi Google Sheets aktif.')
  }
}
