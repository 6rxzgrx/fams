'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Transaction, TransactionCategory, Asset } from '@/domain/types'
import { buildDailyBars } from '@/domain/transactions'
import { formatMoneyCompact } from '@/lib/money'

const chartConfig = {
  income: { label: 'Pemasukan', color: 'var(--success)' },
  expense: { label: 'Pengeluaran', color: 'var(--danger)' },
  transfer: { label: 'Transfer', color: '#60a5fa' },
} satisfies ChartConfig

export function ReportBarChart({
  transactions,
  categories,
  accounts,
  year,
  month,
}: {
  transactions: Transaction[]
  categories: TransactionCategory[]
  accounts: Asset[]
  year: number
  month: number
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAccount, setFilterAccount] = useState('all')

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        if (filterCategory !== 'all' && tx.category_id !== filterCategory) return false
        if (filterAccount !== 'all' && tx.account_id !== filterAccount) return false
        return true
      }),
    [transactions, filterCategory, filterAccount],
  )

  const data = useMemo(() => buildDailyBars(filtered, year, month), [filtered, year, month])

  const daysInMonth = new Date(year, month, 0).getDate()
  const xTicks = [1, 5, 10, 15, 20, 25, daysInMonth].filter(
    (v, i, a) => a.indexOf(v) === i && v <= daysInMonth,
  )

  const expCats = categories.filter((c) => c.type === 'expense' && !c.deleted_at)
  const incCats = categories.filter((c) => c.type === 'income' && !c.deleted_at)
  const allCats = [...incCats, ...expCats]
  const activeAccounts = accounts.filter((a) => !a.deleted_at)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
            Grafik
          </p>
          <p className="font-bold text-[15px] tracking-tight mt-0.5">Transaksi Harian</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs w-38">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {allCats.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue placeholder="Semua Akun" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Akun</SelectItem>
              {activeAccounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {mounted ? (
        <ChartContainer config={chartConfig} className="w-full" style={{ height: 220 }}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 4, top: 4, bottom: 0 }}
            barCategoryGap="15%"
            barGap={2}
          >
            <CartesianGrid vertical={false} strokeOpacity={0.15} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10 }}
              ticks={xTicks}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => formatMoneyCompact(v)}
              width={52}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                const nonZero = payload.filter((e) => (e.value as number) > 0)
                if (!nonZero.length) return null
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
                    <p className="mb-1.5 font-semibold text-foreground">Tanggal {label}</p>
                    {nonZero.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">
                          {chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}
                        </span>
                        <span className="ml-auto font-mono font-semibold tabular-nums">
                          {formatMoneyCompact(entry.value as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Bar dataKey="income" fill="var(--color-income)" radius={[3, 3, 0, 0]} maxBarSize={14} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[3, 3, 0, 0]} maxBarSize={14} />
            <Bar dataKey="transfer" fill="var(--color-transfer)" radius={[3, 3, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ChartContainer>
      ) : (
        <div className="w-full" style={{ height: 220 }} aria-hidden="true" />
      )}

      <div className="flex items-center gap-5 pt-2 border-t border-border mt-2">
        {(Object.entries(chartConfig) as [string, { label: string; color: string }][]).map(
          ([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: val.color }} />
              {val.label}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
