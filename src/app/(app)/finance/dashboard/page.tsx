'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  ArrowLeftRight,
  FileText,
  Briefcase,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Bell,
  Target,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { MoneyDisplay } from '@/components/finance/money-display'
import { TransactionItem } from '@/components/finance/transaction-item'
import { MonthPicker } from '@/components/finance/month-picker'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useAccounts } from '@/hooks/use-accounts'
import { useBudgets } from '@/hooks/use-budgets'
import { sumByType, getMonthRange } from '@/domain/transactions'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'
import { PageContainer } from '@/components/layout/page-container'

function currentYM() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function useDashboard(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const { from, to } = getMonthRange(year, mon)
  const { transactions, isLoading: txLoading } = useTransactions({ from, to, limit: 500 })
  const { categories } = useCategories()
  const { transactions: recent } = useTransactions({ limit: 8 })
  const { accounts, isLoading: accLoading } = useAccounts()
  const { budgets } = useBudgets(month)

  const sums = sumByType(transactions)

  const totalSaldo = accounts
    .filter((a) => a.include_in_saldo !== 'false')
    .reduce((sum, a) => sum + (parseInt(a.current_balance, 10) || 0), 0)

  const totalBudget = budgets.find((b) => b.category_id === '')
  const budgetAmount = totalBudget ? parseInt(totalBudget.allocated_amount, 10) : 0
  const sisaAnggaran = budgetAmount - sums.expense

  return {
    isLoading: txLoading || accLoading,
    sums,
    totalSaldo,
    budgetAmount,
    sisaAnggaran,
    hasBudget: !!totalBudget,
    recentTransactions: recent,
    categories,
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function DashboardPage() {
  const [month, setMonth] = useState(currentYM)
  const { data: session } = useSession()
  const { isLoading, sums, totalSaldo, budgetAmount, sisaAnggaran, hasBudget, recentTransactions, categories } = useDashboard(month)
  const firstName = session?.user?.name?.split(' ')[0] ?? 'Keluarga'

  return (
    <PageContainer className="space-y-6">
      {/* Top bar */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-caption text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
            {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} className="hidden lg:flex" />
          <button
            type="button"
            aria-label="Notifikasi"
            className="hidden size-10 items-center justify-center rounded-pill bg-surface text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
          >
            <Bell className="size-4" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile month picker */}
      <div className="flex justify-center lg:hidden">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {/* Three stat cards */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Pengeluaran */}
        <StatCard
          label="Pengeluaran Bulan Ini"
          value={sums.expense}
          icon={TrendingDown}
          tone="expense"
          isLoading={isLoading}
          href="/finance/transactions"
        />
        {/* Sisa Anggaran */}
        <StatCard
          label="Sisa Anggaran"
          value={hasBudget ? sisaAnggaran : null}
          icon={Target}
          tone={sisaAnggaran < 0 ? 'danger' : 'neutral'}
          isLoading={isLoading}
          href="/finance/anggaran"
          emptyLabel={hasBudget ? undefined : 'Belum diatur'}
        />
        {/* Saldo */}
        <StatCard
          label="Saldo Saat Ini"
          value={totalSaldo}
          icon={Wallet}
          tone="saldo"
          isLoading={isLoading}
          href="/finance/aset"
        />
      </section>

      {/* Quick actions */}
      <section>
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-3">
          <QuickAction href="/finance/transactions" icon={Plus} label="Tambah" tone="accent" />
          <QuickAction href="/finance/bills" icon={FileText} label="Tagihan" />
          <QuickAction href="/finance/aset" icon={Briefcase} label="Aset" />
          <QuickAction href="/finance/anggaran" icon={Target} label="Anggaran" className="hidden lg:flex" />
        </div>
      </section>

      {/* Recent transactions */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-[15px] font-semibold lg:text-base">Transaksi Terbaru</h2>
            <Link
              href="/finance/transactions"
              className="text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Lihat semua
            </Link>
          </div>
          <div className="overflow-hidden rounded-lg bg-surface">
            {isLoading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <Skeleton className="size-10 rounded-pill" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-12 text-center">
                <ArrowLeftRight className="mb-2 size-6 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-sm font-semibold">Belum ada transaksi</p>
                <p className="text-[13px] text-muted-foreground">
                  Tambahkan yang pertama dengan tombol di atas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} categories={categories} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop side panel */}
        <aside className="hidden lg:block" aria-label="Tagihan mendatang">
          <h2 className="mb-3 px-1 text-base font-semibold">Tagihan Mendatang</h2>
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="flex flex-col items-center text-center">
              <span className="mb-2 inline-flex size-10 items-center justify-center rounded-pill bg-muted">
                <FileText className="size-5 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">Belum ada tagihan</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Tagihan & langganan tampil di sini saat ditambahkan.
              </p>
              <Link
                href="/finance/bills"
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
              >
                Atur tagihan
                <ArrowUpRight className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </PageContainer>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  isLoading,
  href,
  emptyLabel,
}: {
  label: string
  value: number | null
  icon: typeof TrendingDown
  tone: 'expense' | 'neutral' | 'saldo' | 'danger'
  isLoading: boolean
  href: string
  emptyLabel?: string
}) {
  const isPositive = (value ?? 0) >= 0

  const toneStyles = {
    expense: 'bg-surface border border-border',
    neutral: 'bg-surface border border-border',
    saldo: isPositive ? 'bg-hero-positive' : 'bg-surface border border-border',
    danger: 'bg-danger/8 border border-danger/20',
  }

  const iconStyles = {
    expense: 'bg-muted text-foreground',
    neutral: 'bg-muted text-foreground',
    saldo: isPositive ? 'bg-black/10 text-foreground' : 'bg-muted text-foreground',
    danger: 'bg-danger/15 text-danger',
  }

  return (
    <Link href={href} className={cn(
      'group flex items-start justify-between rounded-xl p-5 transition-opacity hover:opacity-90',
      toneStyles[tone],
    )}>
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-eyebrow',
          tone === 'saldo' && isPositive ? 'opacity-70' : 'text-muted-foreground',
        )}>
          {label}
        </p>
        <div className="mt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-36" />
          ) : value === null ? (
            <p className="text-sm text-muted-foreground italic">{emptyLabel}</p>
          ) : (
            <p className={cn(
              'text-display !text-[24px] tabular-nums',
              tone === 'danger' ? 'text-danger' : '',
            )}>
              {value < 0 ? '−' : ''}{formatMoney(Math.abs(value))}
            </p>
          )}
        </div>
      </div>
      <div className={cn(
        'ml-3 flex size-9 shrink-0 items-center justify-center rounded-pill',
        iconStyles[tone],
      )}>
        <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
      </div>
    </Link>
  )
}

function QuickAction({
  href,
  icon: Icon,
  label,
  tone,
  className,
}: {
  href: string
  icon: typeof Plus
  label: string
  tone?: 'accent'
  className?: string
}) {
  const isAccent = tone === 'accent'
  return (
    <Link
      href={href}
      className={cn(
        'flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg lg:h-24',
        'transition-[transform,background-color] duration-150 ease-out active:scale-[0.97]',
        isAccent
          ? 'bg-accent text-accent-foreground'
          : 'bg-surface text-foreground hover:bg-muted/60 border border-border lg:border-transparent',
        className,
      )}
    >
      <Icon className="size-5 lg:size-6" strokeWidth={2.25} aria-hidden="true" />
      <span className="text-[12px] font-semibold lg:text-[13px]">{label}</span>
    </Link>
  )
}
