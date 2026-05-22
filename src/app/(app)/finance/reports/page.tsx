'use client'

import { useState, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Flame,
  CalendarDays,
  Trophy,
  PiggyBank,
  Receipt,
  BarChart3,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/layout/page-container'
import { MobileBackButton } from '@/components/nav/mobile-back-button'
import { MonthPicker } from '@/components/finance/month-picker'
import { ReportAiInsight } from '@/components/finance/report-ai-insight'
import type { ReportInsightSummary } from '@/hooks/use-report-insight'
import { ReportBarChart } from '@/components/finance/report-bar-chart'
import { ReportTrendChart } from '@/components/finance/report-trend-chart'
import { ReportTopList } from '@/components/finance/report-top-list'
import { ReportDonutSection } from '@/components/finance/report-donut-section'
import { ReportCalendar } from '@/components/finance/report-calendar'
import { ReportNotes } from '@/components/finance/report-notes'
import { CashflowChart } from '@/components/finance/cashflow-chart'
import { ReportBudgetSection } from '@/components/finance/report-budget-section'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useAccounts } from '@/hooks/use-accounts'
import {
  sumByType,
  getMonthRange,
  getLast12Months,
  groupByDate,
} from '@/domain/transactions'
import { formatMoney, formatMoneyCompact } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useBudgets } from '@/hooks/use-budgets'
import { useBills, useBillPayments } from '@/hooks/use-bills'
import { useAssetSnapshots } from '@/hooks/use-asset-snapshots'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  amount,
  color,
  icon: Icon,
  sub,
}: {
  label: string
  amount: number
  color: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {label}
        </p>
        <span
          className="size-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}1f` }}
        >
          <Icon className="size-4" style={{ color }} />
        </span>
      </div>
      <p
        className="tabular-nums font-bold leading-tight"
        style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', letterSpacing: '-0.03em', color }}
      >
        {formatMoney(amount)}
      </p>
      {sub && <p className="text-[10.5px] text-muted-foreground font-medium">{sub}</p>}
    </div>
  )
}

// ── Callout Card ──────────────────────────────────────────────────────────────
function CalloutCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  className,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: string
  sub?: string
  color: string
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-surface p-3.5 flex items-center gap-3', className)}>
      <span
        className="size-8 shrink-0 rounded-xl flex items-center justify-center"
        style={{ background: `${color}1f` }}
      >
        <Icon className="size-4" style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-bold text-[13.5px] tracking-tight mt-0.5">{value}</p>
        {sub && <p className="text-[10.5px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <p className="px-1 text-[13px] font-semibold text-muted-foreground pt-2">{label}</p>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-4 px-5 lg:px-0">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [month, setMonth] = useState(currentYM)

  const [year, mon] = month.split('-').map(Number)
  const { from, to } = getMonthRange(year, mon)

  // Current month transactions
  const { transactions, isLoading } = useTransactions({ from, to, limit: 500 })
  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { budgets } = useBudgets(month)
  const { bills } = useBills()
  const { payments: billPayments } = useBillPayments(month)
  const { snapshots } = useAssetSnapshots(24)

  // 12-month range for trend
  const { yearFrom, yearTo } = useMemo(() => {
    let startYear = year, startMonth = mon - 11
    while (startMonth <= 0) { startMonth += 12; startYear -= 1 }
    const lastDay = new Date(year, mon, 0).getDate()
    return {
      yearFrom: `${startYear}-${String(startMonth).padStart(2, '0')}-01`,
      yearTo: `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    }
  }, [year, mon])

  const { transactions: yearTransactions, isLoading: yearLoading } = useTransactions({
    from: yearFrom,
    to: yearTo,
    limit: 3000,
  })

  // ── Aggregations ─────────────────────────────────────────────────────────────
  const sums = useMemo(() => sumByType(transactions), [transactions])
  const totalIncome = sums.income + sums.refund
  const net = totalIncome - sums.expense
  const savingsRate = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0

  // Cashflow series (cumulative daily net)
  const cashflowSeries = useMemo(() => {
    const today = new Date()
    const isCurrentMonth = year === today.getFullYear() && mon === today.getMonth() + 1
    const daysInMonth = new Date(year, mon, 0).getDate()
    const maxDay = isCurrentMonth ? today.getDate() : daysInMonth
    const pad = (n: number) => String(n).padStart(2, '0')
    const byDate: Record<string, number> = {}
    for (const tx of transactions) {
      const k = tx.date.slice(0, 10)
      const amt = parseInt(tx.amount, 10) || 0
      if (tx.type === 'income' || tx.type === 'refund') byDate[k] = (byDate[k] || 0) + amt
      else if (tx.type === 'expense') byDate[k] = (byDate[k] || 0) - amt
    }
    let cum = 0
    const series: number[] = []
    for (let d = 1; d <= maxDay; d++) {
      const k = `${year}-${pad(mon)}-${pad(d)}`
      cum += byDate[k] || 0
      series.push(cum)
    }
    return series
  }, [transactions, year, mon])

  // Biggest expense day
  const biggestExpenseDay = useMemo(() => {
    const txByDate = groupByDate(transactions.filter((tx) => tx.type === 'expense'))
    let maxDate = '', maxAmt = 0
    for (const [date, txs] of Object.entries(txByDate)) {
      const total = txs.reduce((s, t) => s + (parseInt(t.amount, 10) || 0), 0)
      if (total > maxAmt) { maxAmt = total; maxDate = date }
    }
    return maxDate ? { date: maxDate, amount: maxAmt } : null
  }, [transactions])

  // Spending streak (consecutive days with any expense)
  const spendingStreak = useMemo(() => {
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const expDates = new Set(
      transactions
        .filter((tx) => tx.type === 'expense')
        .map((tx) => tx.date.slice(0, 10)),
    )
    let streak = 0
    for (let d = today.getDate(); d >= 1; d--) {
      const k = `${year}-${pad(mon)}-${pad(d)}`
      if (expDates.has(k)) streak++
      else break
    }
    return streak
  }, [transactions, year, mon])

  // Top expense categories
  const topExpenseCategories = useMemo(() => {
    const byCategory: Record<string, { name: string; amount: number }> = {}
    for (const tx of transactions) {
      if (tx.type !== 'expense') continue
      const cat = categories.find((c) => c.id === tx.category_id)
      const name = cat?.name ?? 'Lainnya'
      byCategory[name] = { name, amount: (byCategory[name]?.amount ?? 0) + (parseInt(tx.amount, 10) || 0) }
    }
    return Object.values(byCategory)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [transactions, categories])

  // 12-month trend
  const last12 = useMemo(() => getLast12Months(month), [month])
  const trendData = useMemo(() => {
    return last12.map(({ year: y, month: m, label, ym }) => {
      const { from: f, to: t } = getMonthRange(y, m)
      const txs = yearTransactions.filter((tx) => tx.date >= f && tx.date <= t)
      const s = sumByType(txs)
      return { label, income: s.income + s.refund, expense: s.expense, ym }
    })
  }, [yearTransactions, last12])

  // Active (liquid) accounts for filters
  const liquidAccounts = useMemo(
    () => accounts.filter((a) => a.kind === 'liquid' && !a.deleted_at),
    [accounts],
  )

  // Sisa anggaran
  const totalBudget = useMemo(() => {
    const row = budgets.find((b) => !b.deleted_at && !b.category_id && !b.budget_type)
    return row ? parseInt(row.allocated_amount, 10) || 0 : 0
  }, [budgets])
  const sisaAnggaran = totalBudget > 0 ? totalBudget - sums.expense : 0
  const sisaAnggPct = totalBudget > 0
    ? Math.round(Math.abs(sisaAnggaran) / totalBudget * 100)
    : 0

  // Bills payment rate
  const billStats = useMemo(() => {
    const active = bills.filter((b) => !b.deleted_at)
    if (!active.length) return null
    const paidIds = new Set(billPayments.map((p) => p.bill_id))
    const paid = active.filter((b) => paidIds.has(b.id)).length
    return { rate: Math.round((paid / active.length) * 100), paid, total: active.length }
  }, [bills, billPayments])

  // Asset growth from snapshots
  const prevMonthKey = useMemo(() => {
    const d = new Date(year, mon - 2, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [year, mon])

  const snapshotGrowth = useMemo(() => {
    const snapTotal = (s: { liquid_total: string; non_liquid_total: string }) =>
      (parseInt(s.liquid_total, 10) || 0) + (parseInt(s.non_liquid_total, 10) || 0)
    const curr = snapshots.find((s) => s.month === month)
    const prev = snapshots.find((s) => s.month === prevMonthKey)
    if (!curr) return null
    const currTotal = snapTotal(curr)
    const prevTotal = prev ? snapTotal(prev) : null
    const delta = prevTotal !== null ? currTotal - prevTotal : null
    const pct = prevTotal !== null && prevTotal > 0 ? Math.round((delta! / prevTotal) * 100) : null
    return { currTotal, prevTotal, delta, pct }
  }, [snapshots, month, prevMonthKey])

  const monthLabel = new Date(year, mon - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <PageContainer bleed>
      {/* Header */}
      <header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
        <div className="min-w-0">
          <MobileBackButton />
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
            Laporan Keuangan
          </h1>
          <p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
            Ringkasan, grafik, dan insight {monthLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
        </div>
      </header>

      {isLoading && <ReportSkeleton />}

      {!isLoading && (
        <div className="space-y-4 px-5 lg:px-0 pb-8">
          {/* 1. AI Insight */}
          <ReportAiInsight
            month={month}
            summary={{
              month_label: monthLabel,
              income: totalIncome,
              expense: sums.expense,
              net,
              savings_rate: savingsRate,
              transaction_count: transactions.length,
              top_expense_categories: topExpenseCategories,
              biggest_expense_day: biggestExpenseDay,
              spending_streak: spendingStreak,
              trend: trendData,
            } satisfies ReportInsightSummary}
          />

          {/* 2. Ringkasan Bulanan */}
          <SectionDivider label="Ringkasan Bulanan" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Pemasukan"
              amount={totalIncome}
              color="var(--success)"
              icon={TrendingUp}
              sub={`${transactions.filter(tx => tx.type === 'income' || tx.type === 'refund').length} transaksi`}
            />
            <StatCard
              label="Pengeluaran"
              amount={sums.expense}
              color="var(--danger)"
              icon={TrendingDown}
              sub={`${transactions.filter(tx => tx.type === 'expense').length} transaksi`}
            />
            <StatCard
              label="Sisa Anggaran"
              amount={sisaAnggaran}
              color={totalBudget === 0 ? '#94a3b8' : sisaAnggaran >= 0 ? '#5EEAD4' : 'var(--danger)'}
              icon={PiggyBank}
              sub={
                totalBudget === 0
                  ? 'Belum diatur'
                  : sisaAnggaran >= 0
                    ? `${sisaAnggPct}% tersisa`
                    : `${sisaAnggPct}% lewat!`
              }
            />
          </div>

          {/* Callout row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <CalloutCard
              icon={Trophy}
              label="Net Bulan Ini"
              value={`${net >= 0 ? '+' : ''}${formatMoneyCompact(net)}`}
              sub={net >= 0 ? 'Surplus 🎉' : 'Defisit ⚠️'}
              color={net >= 0 ? '#5EEAD4' : '#fb7185'}
            />
            <CalloutCard
              icon={Receipt}
              label="Tagihan Rate"
              value={billStats ? `${billStats.rate}%` : '—'}
              sub={billStats ? `${billStats.paid}/${billStats.total} lunas` : 'Tidak ada tagihan'}
              color={!billStats ? '#94a3b8' : billStats.rate >= 100 ? '#34d399' : billStats.rate >= 50 ? '#f59e0b' : '#fb7185'}
            />
            <CalloutCard
              icon={BarChart3}
              label="Asset Growth"
              value={
                snapshotGrowth?.delta != null
                  ? `${snapshotGrowth.delta >= 0 ? '+' : ''}${formatMoneyCompact(snapshotGrowth.delta)}`
                  : snapshotGrowth
                    ? formatMoneyCompact(snapshotGrowth.currTotal)
                    : '—'
              }
              sub={
                snapshotGrowth
                  ? `${snapshotGrowth.pct != null ? `${snapshotGrowth.pct >= 0 ? '+' : ''}${snapshotGrowth.pct}% · ` : ''}Total ${formatMoneyCompact(snapshotGrowth.currTotal)}`
                  : 'Belum ada snapshot'
              }
              color={
                snapshotGrowth?.delta != null
                  ? snapshotGrowth.delta >= 0 ? '#5EEAD4' : '#fb7185'
                  : '#94a3b8'
              }
            />
            <CalloutCard
              icon={Flame}
              label="Hari Terboros"
              value={biggestExpenseDay ? new Date(biggestExpenseDay.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}
              sub={biggestExpenseDay ? formatMoneyCompact(biggestExpenseDay.amount) : 'Tidak ada data'}
              color="#f59e0b"
            />
            <CalloutCard
              className="col-span-2 lg:col-span-1"
              icon={CalendarDays}
              label="Streak Belanja"
              value={`${spendingStreak} hari`}
              sub={spendingStreak > 0 ? 'berturut-turut' : 'Tidak ada streak'}
              color="#a78bfa"
            />
          </div>

          {/* Row 1: Grafik Transaksi Harian */}
          <SectionDivider label="Grafik Transaksi Harian" />
          <ReportBarChart
            transactions={transactions}
            categories={categories}
            accounts={liquidAccounts}
            year={year}
            month={mon}
          />

          {/* Row 2: Tren 12 Bulan (col 1) + Aliran Dana Harian (col 2) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <SectionDivider label="Tren 12 Bulan" />
              <ReportTrendChart data={trendData} isLoading={yearLoading} />
            </div>
            <div className="space-y-2">
              <SectionDivider label="Aliran Dana Harian" />
              <div className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-3">
                  <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Kumulatif
                  </p>
                  <p className="font-bold text-[15px] tracking-tight mt-0.5">
                    Arus Kas Bulan Ini
                  </p>
                </div>
                <CashflowChart series={cashflowSeries} height={180} positive={net >= 0} />
                <div className="mt-3 pt-3 border-t border-border flex gap-6 text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Net akhir bulan</p>
                    <p className={cn('font-bold tabular-nums text-[14px] mt-0.5', net >= 0 ? 'text-success' : 'text-danger')}>
                      {net >= 0 ? '+' : ''}{formatMoney(net)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total transaksi</p>
                    <p className="font-bold text-[14px] mt-0.5">{transactions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Pemasukan Terbesar (col 1) + Pengeluaran Terbesar (col 2) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <SectionDivider label="Pemasukan Terbesar" />
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase mb-1">Top 5</p>
                <p className="font-bold text-[15px] tracking-tight mb-3">Pemasukan Terbesar</p>
                <ReportTopList transactions={transactions} categories={categories} accounts={accounts} type="income" />
              </div>
            </div>
            <div className="space-y-2">
              <SectionDivider label="Pengeluaran Terbesar" />
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase mb-1">Top 5</p>
                <p className="font-bold text-[15px] tracking-tight mb-3">Pengeluaran Terbesar</p>
                <ReportTopList transactions={transactions} categories={categories} accounts={accounts} type="expense" />
              </div>
            </div>
          </div>

          {/* Row 4: Distribusi per Kategori (col 1) + per Akun (col 2) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <SectionDivider label="Distribusi per Kategori" />
              <ReportDonutSection transactions={transactions} categories={categories} accounts={accounts} groupBy="category" />
            </div>
            <div className="space-y-2">
              <SectionDivider label="Distribusi per Akun" />
              <ReportDonutSection transactions={transactions} categories={categories} accounts={accounts} groupBy="account" />
            </div>
          </div>

          {/* Row 5: Anggaran */}
          {totalBudget > 0 && <SectionDivider label="Laporan Anggaran" />}
          <ReportBudgetSection
            budgets={budgets}
            transactions={transactions}
            categories={categories}
            month={month}
          />

          {/* Row 6: Kalender */}
          <SectionDivider label="Kalender Transaksi" />
          <ReportCalendar
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            year={year}
            month={mon}
          />

          {/* Catatan */}
          <SectionDivider label="Catatan Bulan Ini" />
          <ReportNotes month={month} />
        </div>
      )}
    </PageContainer>
  )
}
