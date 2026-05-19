'use client';

import { Bar, BarChart, CartesianGrid, Cell, XAxis } from 'recharts';

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from '@/components/ui/chart';
import { formatMoneyCompact } from '@/lib/money';

const chartConfig = {
	inc: { label: 'Masuk', color: 'var(--success)' },
	exp: { label: 'Keluar', color: 'var(--danger)' },
} satisfies ChartConfig;

type Month = { m: string; inc: number; exp: number };

export function IncomeExpenseBars({
	months,
	height = 200,
	className,
}: {
	months: Month[];
	height?: number;
	className?: string;
}) {
	if (!months.length) {
		return <div className={className} style={{ height }} aria-hidden="true" />;
	}

	const lastIdx = months.length - 1;

	return (
		<div className={className}>
			<ChartContainer config={chartConfig} style={{ height }} className="w-full">
				<BarChart
					accessibilityLayer
					data={months}
					margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
					barCategoryGap="20%"
					barGap={4}
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="m"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tick={{ fontSize: 11 }}
					/>
					<ChartTooltip
						cursor={false}
						content={({ active, payload, label }) => {
							if (!active || !payload?.length) return null;
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
							);
						}}
					/>
					<Bar dataKey="inc" radius={[4, 4, 0, 0]}>
						{months.map((_, i) => (
							<Cell
								key={i}
								fill="var(--color-inc)"
								fillOpacity={i === lastIdx ? 1 : 0.5}
							/>
						))}
					</Bar>
					<Bar dataKey="exp" radius={[4, 4, 0, 0]}>
						{months.map((_, i) => (
							<Cell
								key={i}
								fill="var(--color-exp)"
								fillOpacity={i === lastIdx ? 1 : 0.45}
							/>
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
		</div>
	);
}
