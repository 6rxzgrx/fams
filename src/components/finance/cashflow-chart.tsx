'use client';

import { Area, AreaChart, CartesianGrid, YAxis } from 'recharts';

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from '@/components/ui/chart';
import { formatMoneyCompact } from '@/lib/money';

const positiveConfig = {
	net: { label: 'Net Kumulatif', color: 'var(--success)' },
} satisfies ChartConfig;

const negativeConfig = {
	net: { label: 'Net Kumulatif', color: 'var(--danger)' },
} satisfies ChartConfig;

export function CashflowChart({
	series,
	height = 160,
	className,
	positive = true,
}: {
	series: number[];
	height?: number;
	className?: string;
	positive?: boolean;
}) {
	if (series.length < 2) {
		return <div className={className} style={{ height }} aria-hidden="true" />;
	}

	const config = positive ? positiveConfig : negativeConfig;
	const data = series.map((v, i) => ({ day: i + 1, net: v }));

	return (
		<div className={className}>
			<ChartContainer config={config} style={{ height }} className="w-full">
				<AreaChart
					accessibilityLayer
					data={data}
					margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
				>
					<CartesianGrid vertical={false} strokeOpacity={0.4} />
					<YAxis hide domain={['auto', 'auto']} />
					<ChartTooltip
						cursor={false}
						content={({ active, payload, label }) => {
							if (!active || !payload?.length) return null;
							return (
								<div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
									<p className="mb-1 text-muted-foreground">Hari ke-{label}</p>
									<p
										className="font-mono font-semibold tabular-nums"
										style={{ color: 'var(--color-net)' }}
									>
										{formatMoneyCompact(payload[0]?.value as number)}
									</p>
								</div>
							);
						}}
					/>
					<defs>
						<linearGradient id="fillCashflow" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="var(--color-net)" stopOpacity={0.8} />
							<stop offset="95%" stopColor="var(--color-net)" stopOpacity={0.05} />
						</linearGradient>
					</defs>
					<Area
						dataKey="net"
						type="natural"
						fill="url(#fillCashflow)"
						fillOpacity={0.4}
						stroke="var(--color-net)"
						strokeWidth={2}
					/>
				</AreaChart>
			</ChartContainer>
		</div>
	);
}
