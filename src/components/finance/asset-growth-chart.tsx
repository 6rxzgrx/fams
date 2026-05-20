'use client';

import { useSyncExternalStore } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from '@/components/ui/chart';
import { formatMoneyCompact } from '@/lib/money';
import type { AssetSnapshot } from '@/domain/types';

const MONTH_SHORT_ID = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'Mei',
	'Jun',
	'Jul',
	'Agu',
	'Sep',
	'Okt',
	'Nov',
	'Des',
];

function monthLabel(ym: string) {
	const m = parseInt(ym.split('-')[1], 10);
	return MONTH_SHORT_ID[m - 1] ?? ym;
}

const chartConfig = {
	liquid: {
		label: 'Likuid',
		color: 'var(--chart-liquid, #3b82f6)',
	},
	nonLiquid: {
		label: 'Non Likuid',
		color: 'var(--chart-nonliquid, #eab308)',
	},
} satisfies ChartConfig;

interface Props {
	snapshots: AssetSnapshot[];
	height?: number;
	className?: string;
	liveMonth?: string;
}

export function AssetGrowthChart({
	snapshots,
	height = 260,
	className,
	liveMonth,
}: Props) {
	const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);

	if (!isClient || snapshots.length < 1) {
		return <div className={className} style={{ height }} aria-hidden="true" />;
	}

	const data = snapshots.map((s) => ({
		month: s.month === liveMonth ? monthLabel(s.month) + '*' : monthLabel(s.month),
		liquid: parseInt(s.liquid_total, 10) || 0,
		nonLiquid: parseInt(s.non_liquid_total, 10) || 0,
	}));

	return (
		<div className={className}>
			<ChartContainer
				config={chartConfig}
				style={{ height }}
				className="w-full"
			>
				<AreaChart
					accessibilityLayer
					data={data}
					margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
				>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis
						dataKey="month"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tick={{ fontSize: 11 }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={4}
						tick={{ fontSize: 10 }}
						tickFormatter={(v) => formatMoneyCompact(v)}
						width={56}
					/>
					<ChartTooltip
						cursor={false}
						content={({ active, payload, label }) => {
							if (!active || !payload?.length) return null;
							return (
								<div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
									<p className="mb-1.5 font-semibold text-foreground">
										{label}
									</p>
									{payload.map((entry, i) => (
										<div
											key={`${String(entry.dataKey)}-${i}`}
											className="flex items-center gap-2"
										>
											<span
												className="size-2 rounded-full"
												style={{ backgroundColor: entry.color }}
											/>
											<span className="text-muted-foreground">
												{
													chartConfig[entry.dataKey as keyof typeof chartConfig]
														?.label
												}
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
					<defs>
						<linearGradient id="fillLiquid" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="5%"
								stopColor="var(--color-liquid)"
								stopOpacity={0.8}
							/>
							<stop
								offset="95%"
								stopColor="var(--color-liquid)"
								stopOpacity={0.1}
							/>
						</linearGradient>
						<linearGradient id="fillNonLiquid" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="5%"
								stopColor="var(--color-nonLiquid)"
								stopOpacity={0.8}
							/>
							<stop
								offset="95%"
								stopColor="var(--color-nonLiquid)"
								stopOpacity={0.1}
							/>
						</linearGradient>
					</defs>
					<Area
						dataKey="nonLiquid"
						type="natural"
						fill="url(#fillNonLiquid)"
						fillOpacity={0.4}
						stroke="var(--color-nonLiquid)"
						strokeWidth={2}
						stackId="a"
					/>
					<Area
						dataKey="liquid"
						type="natural"
						fill="url(#fillLiquid)"
						fillOpacity={0.4}
						stroke="var(--color-liquid)"
						strokeWidth={2}
						stackId="a"
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}

// ── Footer stats helpers ────────────────────────────────────────────────────

export function computeGrowthStats(snapshots: AssetSnapshot[]) {
	if (snapshots.length === 0)
		return { growthPct: null, avgMonthly: null, currentMonth: '' };

	const last = snapshots[snapshots.length - 1];
	const prev = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;

	const lastTotal =
		(parseInt(last.liquid_total, 10) || 0) +
		(parseInt(last.non_liquid_total, 10) || 0);
	const prevTotal = prev
		? (parseInt(prev.liquid_total, 10) || 0) +
			(parseInt(prev.non_liquid_total, 10) || 0)
		: null;

	const growthPct =
		prevTotal && prevTotal > 0
			? ((lastTotal - prevTotal) / prevTotal) * 100
			: null;

	const avgMonthly =
		snapshots.length > 1
			? (() => {
					const first = snapshots[0];
					const firstTotal =
						(parseInt(first.liquid_total, 10) || 0) +
						(parseInt(first.non_liquid_total, 10) || 0);
					return (lastTotal - firstTotal) / (snapshots.length - 1);
				})()
			: null;

	return { growthPct, avgMonthly, currentMonth: last.month };
}
