'use client'

import { useSyncExternalStore } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatMoneyCompact } from '@/lib/money'
import type { MonthTrend } from '@/domain/transactions'

const chartConfig = {
  income: { label: 'Pemasukan', color: 'var(--success)' },
  expense: { label: 'Pengeluaran', color: 'var(--danger)' },
} satisfies ChartConfig

export function ReportTrendChart({
  data,
  isLoading,
}: {
  data: MonthTrend[]
  isLoading?: boolean
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4">
        <p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Tren
        </p>
        <p className="font-bold text-[15px] tracking-tight mt-0.5">12 Bulan Terakhir</p>
      </div>

      {mounted && !isLoading ? (
        <ChartContainer config={chartConfig} className="w-full" style={{ height: 200 }}>
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 4, top: 4, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trendIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="trendExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.15} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10 }}
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
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
                    <p className="mb-1.5 font-semibold text-foreground">{label}</p>
                    {payload.map((entry, i) => (
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
            <Area
              dataKey="income"
              type="monotone"
              fill="url(#trendIncome)"
              stroke="var(--color-income)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              dataKey="expense"
              type="monotone"
              fill="url(#trendExpense)"
              stroke="var(--color-expense)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height: 200 }}>
          {isLoading && (
            <div className="space-y-2 w-full px-2">
              {[40, 70, 55, 80, 60, 90].map((h, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full bg-muted animate-pulse"
                  style={{ width: `${h}%`, animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          )}
        </div>
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
