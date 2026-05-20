'use client';

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import {
	Target,
	SlidersHorizontal,
	ChevronDown,
	ChevronRight,
	Plus,
	Home,
	TrendingUp,
	Heart,
	Gift,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/sections/empty-state';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { MoneyInput } from '@/components/finance/money-input';
import { MonthPicker } from '@/components/finance/month-picker';
import { CategoryIcon } from '@/components/finance/category-icon';
import {
	useBudgets,
	useCreateBudget,
	useDeleteBudget,
} from '@/hooks/use-budgets';
import { useTransactions } from '@/hooks/use-transactions';
import { useCategories } from '@/hooks/use-categories';
import { formatCategoryLabel } from '@/domain/categories';
import { sumByType, getMonthRange, spentForType } from '@/domain/transactions';
import {
	Area,
	ComposedChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Line,
} from 'recharts';
import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from '@/components/ui/chart';
import { PageContainer } from '@/components/layout/page-container';
import { MobileBackButton } from '@/components/nav/mobile-back-button';
import { formatMoney, formatMoneyCompact } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
	BUDGET_TYPES,
	BUDGET_TYPE_LABELS,
	BUDGET_TYPE_COLORS,
} from '@/domain/constants';
import type { Budget, BudgetType, TransactionCategory } from '@/domain/types';

function currentYM() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const BUDGET_TYPE_ICONS: Record<
	BudgetType,
	React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
	needs: Home,
	savings: TrendingUp,
	wants: Heart,
	sedekah: Gift,
};

// ── SisaCard ──────────────────────────────────────────────────────────────────
function SisaCard({
	totalAmount,
	spent,
	remaining,
	spentPct,
	month,
	budgetedCatCount,
	activeTypeCount,
}: {
	totalAmount: number;
	spent: number;
	remaining: number;
	spentPct: number;
	month: string;
	budgetedCatCount: number;
	activeTypeCount: number;
}) {
	const sisaPct = Math.max(0, 100 - spentPct);
	const monthLabel = month.replace('-', ' / ');
	const isSafe = remaining >= 0;

	const [y, m] = month.split('-').map(Number);
	const today = new Date();
	const isCurrentMonth =
		y === today.getFullYear() && m === today.getMonth() + 1;
	const daysInMonth = new Date(y, m, 0).getDate();
	const daysLeft = isCurrentMonth ? daysInMonth - today.getDate() : 0;

	// r=56, C=2π×56≈351.86 for 140px ring (thick=12)
	// r=38, C=2π×38≈238.76 for 96px ring (thick=9)
	const sisaDashLg = (sisaPct / 100) * 351.86;
	const sisaDashSm = (sisaPct / 100) * 238.76;

	return (
		<div className="rounded-2xl border border-border bg-surface p-5 flex flex-col">
			{/* Eyebrow */}
			<div className="flex items-center justify-between">
				<p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
					Sisa Anggaran · {monthLabel}
				</p>
				{daysLeft > 0 && (
					<span
						className="text-[10.5px] font-bold rounded-full px-2 py-0.5"
						style={{ background: 'rgba(94,234,212,0.14)', color: '#5EEAD4' }}
					>
						{daysLeft} hari lagi
					</span>
				)}
			</div>

			{/* Ring + amount */}
			<div className="flex items-center gap-4 lg:gap-6 mt-4">
				{/* Desktop 140px ring */}
				<div
					className="relative shrink-0 hidden lg:block"
					style={{ width: 140, height: 140 }}
				>
					<svg width="140" height="140">
						<circle
							cx="70"
							cy="70"
							r="56"
							fill="none"
							stroke="rgba(255,255,255,0.07)"
							strokeWidth="12"
						/>
						<circle
							cx="70"
							cy="70"
							r="56"
							fill="none"
							stroke="#5EEAD4"
							strokeWidth="12"
							strokeLinecap="round"
							strokeDasharray={`${sisaDashLg} 351.86`}
							transform="rotate(-90 70 70)"
						/>
					</svg>
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<span
							className="tabular-nums font-bold text-[#5EEAD4] leading-none"
							style={{ fontSize: 30, letterSpacing: '-0.035em' }}
						>
							{sisaPct.toFixed(0)}
							<span style={{ fontSize: 18 }} className="text-muted-foreground">
								%
							</span>
						</span>
						<span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground mt-1 uppercase">
							Tersisa
						</span>
					</div>
				</div>
				{/* Mobile 96px ring */}
				<div
					className="relative shrink-0 lg:hidden"
					style={{ width: 96, height: 96 }}
				>
					<svg width="96" height="96">
						<circle
							cx="48"
							cy="48"
							r="38"
							fill="none"
							stroke="rgba(255,255,255,0.07)"
							strokeWidth="9"
						/>
						<circle
							cx="48"
							cy="48"
							r="38"
							fill="none"
							stroke="#5EEAD4"
							strokeWidth="9"
							strokeLinecap="round"
							strokeDasharray={`${sisaDashSm} 238.76`}
							transform="rotate(-90 48 48)"
						/>
					</svg>
					<div className="absolute inset-0 flex flex-col items-center justify-center">
						<span
							className="tabular-nums font-bold text-[#5EEAD4] leading-none"
							style={{ fontSize: 22, letterSpacing: '-0.03em' }}
						>
							{sisaPct.toFixed(0)}
							<span style={{ fontSize: 12 }} className="text-muted-foreground">
								%
							</span>
						</span>
						<span className="text-[8.5px] font-semibold tracking-[0.06em] text-muted-foreground mt-0.5 uppercase">
							Tersisa
						</span>
					</div>
				</div>

				<div className="flex-1 min-w-0">
					<p
						className={cn(
							'tabular-nums font-bold leading-tight',
							isSafe ? 'text-foreground' : 'text-[#FB7185]',
						)}
						style={{
							fontSize: 'clamp(20px, 4vw, 34px)',
							letterSpacing: '-0.03em',
						}}
					>
						{formatMoney(Math.abs(remaining))}
					</p>
					<p className="text-muted-foreground font-medium mt-1.5 text-[11px] lg:text-[12.5px]">
						{isSafe ? 'masih bisa digunakan' : 'melebihi anggaran'}
					</p>
				</div>
			</div>

			{/* Footer grid */}
			<div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 lg:gap-4">
				<div>
					<div className="flex items-center gap-1.5 mb-1">
						<span
							className="size-2 rounded-[3px]"
							style={{ background: '#FB7185' }}
						/>
						<span className="text-[9.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
							Terpakai
						</span>
					</div>
					<p
						className="tabular-nums font-bold text-[14.5px] lg:text-[17px]"
						style={{ letterSpacing: '-0.02em' }}
					>
						{formatMoney(spent)}
					</p>
					<p className="text-muted-foreground font-medium mt-0.5 text-[10px] lg:text-[11px]">
						{spentPct.toFixed(0)}%
					</p>
				</div>
				<div>
					<div className="flex items-center gap-1.5 mb-1">
						<span
							className="size-2 rounded-[3px]"
							style={{ background: '#C5F23E' }}
						/>
						<span className="text-[9.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
							Total
						</span>
					</div>
					<p
						className="tabular-nums font-bold text-[14.5px] lg:text-[17px]"
						style={{ letterSpacing: '-0.02em' }}
					>
						{formatMoney(totalAmount)}
					</p>
					<p className="text-muted-foreground font-medium mt-0.5 text-[10px] lg:text-[11px]">
						{budgetedCatCount > 0
							? `${budgetedCatCount} kategori · ${activeTypeCount} tipe`
							: `${activeTypeCount} tipe`}
					</p>
				</div>
			</div>
		</div>
	);
}

// ── PenggunaanChart ───────────────────────────────────────────────────────────
const penggunaanConfig = {
	actuals: { label: 'Aktual', color: '#FB7185' },
	plan: { label: 'Rencana', color: 'rgba(255,255,255,0.3)' },
} satisfies ChartConfig;

function PenggunaanChart({
	cumulativePoints,
	totalBudget,
	daysInMonth,
	dailyAllowance,
}: {
	cumulativePoints: Array<[number, number]>;
	totalBudget: number;
	daysInMonth: number;
	dailyAllowance: number;
}) {
	const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

	const actualsMap = new Map(cumulativePoints.map(([d, v]) => [d, v]));
	const maxActual = cumulativePoints.length
		? Math.max(...cumulativePoints.map(([, v]) => v))
		: 0;
	const maxVal = Math.max(totalBudget * 1.5, maxActual, 1);

	const data = Array.from({ length: daysInMonth }, (_, i) => {
		const day = i + 1;
		return {
			day,
			plan: totalBudget > 0 ? (totalBudget / daysInMonth) * day : null,
			actuals: actualsMap.has(day) ? (actualsMap.get(day) ?? null) : null,
		};
	});

	const xTicks = [1, 6, 11, 16, 21, 26, daysInMonth].filter(
		(v, i, a) => a.indexOf(v) === i && v <= daysInMonth,
	);

	return (
		<div className="rounded-2xl border border-border bg-surface p-5 flex flex-col">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
				<div>
					<p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
						Progress
					</p>
					<p className="font-bold text-[15px] mt-1 tracking-tight">
						Penggunaan Anggaran vs Rencana
					</p>
				</div>
				{dailyAllowance > 0 && (
					<div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[11px] shrink-0 self-start">
						<span className="text-muted-foreground">Bisa keluarkan</span>
						<span className="font-bold tabular-nums">
							{formatMoney(Math.round(dailyAllowance))}
						</span>
						<span className="text-muted-foreground">/hari</span>
					</div>
				)}
			</div>

			{mounted ? (
				<ChartContainer
					config={penggunaanConfig}
					className="w-full mt-3"
					style={{ height: 220 }}
				>
					<ComposedChart
						accessibilityLayer
						data={data}
						margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
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
							tickMargin={4}
							tick={{ fontSize: 10 }}
							tickFormatter={(v) => formatMoneyCompact(v)}
							domain={[0, maxVal]}
							width={52}
						/>
						<ChartTooltip
							cursor={false}
							content={({ active, payload, label }) => {
								if (!active || !payload?.length) return null;
								return (
									<div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-xl">
										<p className="mb-1.5 font-semibold text-foreground">
											Hari ke-{label}
										</p>
										{payload.map((entry, i) =>
											entry.value !== null ? (
												<div key={i} className="flex items-center gap-2">
													<span
														className="size-2 rounded-full"
														style={{ backgroundColor: entry.color }}
													/>
													<span className="text-muted-foreground">
														{
															penggunaanConfig[
																entry.dataKey as keyof typeof penggunaanConfig
															]?.label
														}
													</span>
													<span className="ml-auto font-mono font-semibold tabular-nums">
														{formatMoneyCompact(entry.value as number)}
													</span>
												</div>
											) : null,
										)}
									</div>
								);
							}}
						/>
						<defs>
							<linearGradient id="pgAreaGrad" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="5%"
									stopColor="var(--color-actuals)"
									stopOpacity={0.7}
								/>
								<stop
									offset="95%"
									stopColor="var(--color-actuals)"
									stopOpacity={0.03}
								/>
							</linearGradient>
						</defs>
						<Area
							dataKey="actuals"
							type="monotone"
							fill="url(#pgAreaGrad)"
							fillOpacity={0.4}
							stroke="var(--color-actuals)"
							strokeWidth={2.5}
							dot={false}
							connectNulls={false}
						/>
						<Line
							dataKey="plan"
							type="linear"
							stroke="var(--color-plan)"
							strokeWidth={1.5}
							strokeDasharray="5 5"
							dot={false}
							connectNulls
						/>
					</ComposedChart>
				</ChartContainer>
			) : (
				<div className="w-full mt-3" style={{ height: 220 }} aria-hidden="true" />
			)}

			<div className="flex items-center gap-4 pt-2 border-t border-border mt-2">
				<div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
					<svg width="20" height="4">
						<line
							x1="0"
							y1="2"
							x2="20"
							y2="2"
							stroke="rgba(255,255,255,0.28)"
							strokeWidth="1.5"
							strokeDasharray="4 4"
						/>
					</svg>
					Rencana
				</div>
				<div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
					<svg width="20" height="4">
						<line
							x1="0"
							y1="2"
							x2="20"
							y2="2"
							stroke="#FB7185"
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</svg>
					Aktual
				</div>
			</div>
		</div>
	);
}

// ── BudgetTypeSection ─────────────────────────────────────────────────────────
function BudgetTypeSection({
	bt,
	typeBudget,
	typeSpent,
	totalBudget,
	catBudgets,
	categories,
	spentByCategory,
	txLoading,
}: {
	bt: BudgetType;
	typeBudget: number;
	typeSpent: number;
	totalBudget: number;
	catBudgets: Budget[];
	categories: TransactionCategory[];
	spentByCategory: Record<string, number>;
	txLoading: boolean;
}) {
	const [expanded, setExpanded] = useState(false);
	const color = BUDGET_TYPE_COLORS[bt];
	const label = BUDGET_TYPE_LABELS[bt];
	const Icon = BUDGET_TYPE_ICONS[bt];

	const typeCategories = categories.filter(
		(c) =>
			c.type === 'expense' &&
			!c.parent_id &&
			c.budget_type === bt &&
			!c.deleted_at,
	);
	const typePct = typeBudget > 0 ? (typeSpent / typeBudget) * 100 : 0;
	const typeRemaining = typeBudget - typeSpent;
	const isOver = typeBudget > 0 && typeSpent > typeBudget;
	const allocationPct =
		totalBudget > 0 && typeBudget > 0
			? Math.round((typeBudget / totalBudget) * 100)
			: 0;

	const ringSize = 52,
		ringR = 20,
		ringC = 2 * Math.PI * ringR;
	const ringDash = (Math.min(typePct, 100) / 100) * ringC;

	return (
		<div className="rounded-2xl border border-border bg-surface overflow-hidden">
			{/* Header */}
			<button
				type="button"
				className="w-full flex items-center gap-3 p-5 text-left"
				onClick={() => setExpanded((e) => !e)}
			>
				<span
					className="size-10 rounded-xl flex items-center justify-center shrink-0"
					style={{ background: `${color}1f` }}
				>
					<Icon className="size-5" style={{ color } as React.CSSProperties} />
				</span>
				<div className="flex-1 min-w-0">
					<div className="flex items-baseline gap-2">
						<span className="font-bold text-[15px] tracking-tight">
							{label}
						</span>
						{allocationPct > 0 && (
							<span className="text-[11px] font-semibold text-muted-foreground tabular-nums rounded-full bg-muted px-1.5 py-0.5">
								{allocationPct}%
							</span>
						)}
					</div>
					<span className="text-[11.5px] text-muted-foreground font-medium mt-0.5 block">
						{typeCategories.length} kategori
					</span>
				</div>
				{/* Desktop: terpakai summary */}
				<div className="text-right hidden sm:block mr-3">
					<p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase mb-1">
						Terpakai
					</p>
					<p className="tabular-nums font-bold text-[16px] tracking-tight">
						{txLoading ? '…' : formatMoney(typeSpent)}
					</p>
					<p className="tabular-nums text-[11px] text-muted-foreground font-semibold mt-0.5">
						/ {formatMoney(typeBudget)}
					</p>
				</div>
				{/* Mini donut ring */}
				{typeBudget > 0 && (
					<div
						className="relative shrink-0"
						style={{ width: ringSize, height: ringSize }}
					>
						<svg width={ringSize} height={ringSize}>
							<circle
								cx={ringSize / 2}
								cy={ringSize / 2}
								r={ringR}
								fill="none"
								stroke="rgba(255,255,255,0.07)"
								strokeWidth="5"
							/>
							<circle
								cx={ringSize / 2}
								cy={ringSize / 2}
								r={ringR}
								fill="none"
								stroke={isOver ? '#ef4444' : color}
								strokeWidth="5"
								strokeLinecap="round"
								strokeDasharray={`${ringDash} ${ringC}`}
								transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
							/>
						</svg>
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="tabular-nums font-bold text-foreground text-[10.5px]">
								{typePct.toFixed(0)}%
							</span>
						</div>
					</div>
				)}
				{expanded ? (
					<ChevronDown className="size-4 text-muted-foreground shrink-0" />
				) : (
					<ChevronRight className="size-4 text-muted-foreground shrink-0" />
				)}
			</button>

			{/* Progress bar */}
			{typeBudget > 0 && (
				<div className="px-5 pb-4 -mt-1">
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full transition-all duration-700"
							style={{
								width: `${Math.min(typePct, 100)}%`,
								backgroundColor: isOver ? '#ef4444' : color,
							}}
						/>
					</div>
					<div className="flex justify-between mt-1.5">
						<span className="text-[11px] text-muted-foreground tabular-nums">
							{txLoading ? '…' : `${formatMoney(typeSpent)} terpakai`}
						</span>
						<span
							className={cn(
								'text-[11px] font-medium tabular-nums',
								isOver ? 'text-[#FB7185]' : 'text-muted-foreground',
							)}
						>
							{txLoading
								? '…'
								: isOver
									? `-${formatMoney(Math.abs(typeRemaining))} lewat`
									: `${formatMoney(typeRemaining)} sisa`}
						</span>
					</div>
				</div>
			)}

			{/* Category rows */}
			{expanded && typeCategories.length > 0 && (
				<div className="border-t border-border bg-muted/20 divide-y divide-border">
					{typeCategories.map((cat) => {
						const catBudget = catBudgets.find((b) => b.category_id === cat.id);
						const catAmount = catBudget
							? parseInt(catBudget.allocated_amount, 10)
							: 0;
						const catSpent = categories
							.filter(
								(c) =>
									c.id === cat.id || (c.parent_id === cat.id && !c.deleted_at),
							)
							.reduce((sum, c) => sum + (spentByCategory[c.id] ?? 0), 0);
						const catPct = catAmount > 0 ? (catSpent / catAmount) * 100 : 0;
						const catIsOver = catAmount > 0 && catSpent > catAmount;
						const catRemaining = catAmount - catSpent;
						const barColor = catIsOver
							? '#ef4444'
							: catPct >= 90
								? '#ef4444'
								: catPct >= 75
									? '#FBBF24'
									: color;

						return (
							<div key={cat.id}>
								{/* Mobile */}
								<div className="flex items-center gap-3 px-5 py-3 lg:hidden">
									<span
										className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl"
										style={{
											background: `${cat.color ?? '#64748b'}1f`,
											color: cat.color ?? '#64748b',
										}}
									>
										<CategoryIcon icon={cat.icon ?? 'tag'} className="size-4" />
									</span>
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<p className="truncate text-[13px] font-semibold">
												{formatCategoryLabel(cat, categories)}
											</p>
											<div className="flex items-baseline gap-1 shrink-0">
												<p
													className={cn(
														'tabular-nums text-[13px] font-bold',
														catIsOver && 'text-[#FB7185]',
													)}
												>
													{txLoading ? '…' : formatMoney(catSpent)}
												</p>
												{catAmount > 0 && (
													<p className="tabular-nums text-[10.5px] text-muted-foreground">
														/ {formatMoney(catAmount)}
													</p>
												)}
											</div>
										</div>
										{catAmount > 0 && (
											<div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full transition-all duration-700"
													style={{
														width: `${Math.min(catPct, 100)}%`,
														backgroundColor: barColor,
													}}
												/>
											</div>
										)}
										{catAmount === 0 && catSpent > 0 && (
											<p className="mt-0.5 text-[10.5px] text-muted-foreground">
												Tanpa alokasi khusus
											</p>
										)}
									</div>
								</div>

								{/* Desktop: 4-col grid */}
								<div
									className="hidden lg:grid items-center gap-4 px-5 py-3.5"
									style={{ gridTemplateColumns: '40px 1fr 260px 130px' }}
								>
									<span
										className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl"
										style={{
											background: `${cat.color ?? '#64748b'}1f`,
											color: cat.color ?? '#64748b',
										}}
									>
										<CategoryIcon
											icon={cat.icon ?? 'tag'}
											className="size-[18px]"
										/>
									</span>
									<div>
										<p className="text-[13.5px] font-semibold">
											{formatCategoryLabel(cat, categories)}
										</p>
										<p className="text-[11px] text-muted-foreground mt-0.5">
											{catAmount > 0
												? `Alokasi ${formatMoney(catAmount)}`
												: 'Tanpa alokasi khusus'}
										</p>
									</div>
									<div>
										<div className="h-1.5 overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full transition-all duration-700"
												style={{
													width: `${Math.min(catPct, 100)}%`,
													backgroundColor: barColor,
												}}
											/>
										</div>
										<div className="flex justify-between mt-1">
											<span
												className={cn(
													'text-[10.5px] font-semibold tabular-nums',
													catIsOver
														? 'text-[#FB7185]'
														: 'text-muted-foreground',
												)}
											>
												{txLoading
													? '…'
													: catIsOver
														? `Lewat ${formatMoney(Math.abs(catRemaining))}`
														: catAmount > 0
															? `Sisa ${formatMoney(catRemaining)}`
															: '—'}
											</span>
											{catAmount > 0 && (
												<span
													className="text-[10.5px] font-bold tabular-nums"
													style={{ color: barColor }}
												>
													{catPct.toFixed(0)}%
												</span>
											)}
										</div>
									</div>
									<div className="text-right">
										<p
											className={cn(
												'tabular-nums font-bold text-[14.5px] tracking-tight',
												catIsOver && 'text-[#FB7185]',
											)}
										>
											{txLoading ? '…' : formatMoney(catSpent)}
										</p>
										{catAmount > 0 && (
											<p className="tabular-nums text-[11px] text-muted-foreground font-semibold mt-0.5">
												/ {formatMoney(catAmount)}
											</p>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnggaranPage() {
	const [month, setMonth] = useState(currentYM);
	const [setupOpen, setSetupOpen] = useState(false);
	const [setupKey, setSetupKey] = useState(0);
	const openSetup = useCallback(() => {
		setSetupOpen(true);
		setSetupKey((k) => k + 1);
	}, []);

	const { budgets, isLoading, mutate } = useBudgets(month);
	const { categories } = useCategories();

	const [year, mon] = month.split('-').map(Number);
	const { from, to } = getMonthRange(year, mon);
	const { transactions, isLoading: txLoading } = useTransactions({
		from,
		to,
		limit: 500,
	});
	const sums = sumByType(transactions);

	const totalBudget = budgets.find(
		(b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === '',
	);
	const totalAmount = totalBudget
		? parseInt(totalBudget.allocated_amount, 10)
		: 0;
	const spent = sums.expense;
	const remaining = totalAmount - spent;
	const spentPct = totalAmount > 0 ? (spent / totalAmount) * 100 : 0;

	const spentByCategory = useMemo(
		() =>
			transactions
				.filter((t) => t.type === 'expense')
				.reduce<Record<string, number>>((acc, t) => {
					if (t.category_id)
						acc[t.category_id] =
							(acc[t.category_id] || 0) + parseInt(t.amount, 10);
					return acc;
				}, {}),
		[transactions],
	);

	// Chart data
	const daysInMonthCount = new Date(year, mon, 0).getDate();
	const today = new Date();
	const isCurrentMonth =
		year === today.getFullYear() && mon === today.getMonth() + 1;
	const currentDayInMonth = isCurrentMonth ? today.getDate() : daysInMonthCount;
	const daysLeft = isCurrentMonth ? daysInMonthCount - today.getDate() : 0;

	const cumulativePoints = useMemo((): Array<[number, number]> => {
		const byDate: Record<string, number> = {};
		for (const tx of transactions) {
			if (tx.type === 'expense' && tx.date) {
				const k = tx.date.slice(0, 10);
				byDate[k] = (byDate[k] || 0) + parseInt(tx.amount, 10);
			}
		}
		const pts: Array<[number, number]> = [];
		let cum = 0;
		for (let d = 1; d <= currentDayInMonth; d++) {
			const k = `${year}-${String(mon).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cum += byDate[k] || 0;
			pts.push([d, cum]);
		}
		return pts;
	}, [transactions, currentDayInMonth, year, mon]);

	const dailyAllowance =
		remaining > 0 && daysLeft > 0 ? remaining / daysLeft : 0;

	function getTypeBudget(bt: BudgetType) {
		return budgets.find(
			(b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === bt,
		);
	}
	function getCatBudgetsForType(bt: BudgetType) {
		return budgets.filter(
			(b) => (b.category_id ?? '') !== '' && (b.budget_type ?? '') === bt,
		);
	}

	const budgetedCatCount = budgets.filter(
		(b) => b.category_id && b.category_id !== '',
	).length;
	const activeTypeCount = BUDGET_TYPES.filter(
		(bt) => getTypeBudget(bt) !== undefined,
	).length;

	return (
		<PageContainer bleed>
			{/* Header */}
			<header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
				<div className="min-w-0">
					<MobileBackButton />
					<h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
						Anggaran
					</h1>
					<p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
						When everything is planned, success is sure to follow.
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<MonthPicker value={month} onChange={setMonth} />
					<Button
						variant="accent"
						size="sm"
						onClick={openSetup}
						className="shrink-0 gap-1.5"
					>
						<SlidersHorizontal className="size-3.5" />
						<span className="hidden sm:inline">Ubah Anggaran</span>
						<span className="sm:hidden">Ubah</span>
					</Button>
				</div>
			</header>

			{/* Loading */}
			{isLoading && (
				<div className="space-y-3 px-5 lg:px-0">
					{/* Hero: SisaCard | Chart */}
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
						<Skeleton className="h-64 w-full rounded-2xl" />
						<Skeleton className="h-64 w-full rounded-2xl" />
					</div>
					{/* Section label */}
					<Skeleton className="h-4 w-28 rounded" />
					{/* 4 budget-type rows */}
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="overflow-hidden rounded-xl border border-border">
							<div className="flex items-center justify-between gap-3 px-5 py-4">
								<div className="flex items-center gap-3">
									<Skeleton className="size-9 shrink-0 rounded-xl" />
									<div className="space-y-1.5">
										<Skeleton className="h-3.5 w-24 rounded" />
										<Skeleton className="h-3 w-16 rounded" />
									</div>
								</div>
								<Skeleton className="h-4 w-20 rounded" />
							</div>
						</div>
					))}
				</div>
			)}

			{!isLoading && (
				<div className="space-y-4 px-5 lg:px-0">
					{/* Empty state */}
					{!totalBudget && (
						<EmptyState
							icon={Target}
							title="Belum ada anggaran bulan ini"
							description="Atur total anggaran dan alokasikan per tipe pengeluaran."
							action={
								<Button variant="accent" onClick={openSetup}>
									<Plus className="size-4" />
									Buat Anggaran
								</Button>
							}
						/>
					)}

					{/* Hero 2-col grid */}
					{totalBudget && (
						<div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4">
							<SisaCard
								totalAmount={totalAmount}
								spent={spent}
								remaining={remaining}
								spentPct={txLoading ? 0 : spentPct}
								month={month}
								budgetedCatCount={budgetedCatCount}
								activeTypeCount={activeTypeCount}
							/>
							<PenggunaanChart
								cumulativePoints={txLoading ? [] : cumulativePoints}
								totalBudget={totalAmount}
								daysInMonth={daysInMonthCount}
								dailyAllowance={txLoading ? 0 : dailyAllowance}
							/>
						</div>
					)}

					{/* Budget type sections */}
					{totalBudget && (
						<div className="space-y-3">
							<p className="px-1 text-[13px] font-semibold text-muted-foreground">
								Tipe Anggaran
							</p>
							{BUDGET_TYPES.map((bt) => {
								const typeBudgetEntry = getTypeBudget(bt);
								const typeBudgetAmount = typeBudgetEntry
									? parseInt(typeBudgetEntry.allocated_amount, 10)
									: 0;
								const typeSpent = txLoading
									? 0
									: spentForType(bt, categories, spentByCategory);
								return (
									<BudgetTypeSection
										key={bt}
										bt={bt}
										typeBudget={typeBudgetAmount}
										typeSpent={typeSpent}
										totalBudget={totalAmount}
										catBudgets={getCatBudgetsForType(bt)}
										categories={categories}
										spentByCategory={spentByCategory}
										txLoading={txLoading}
									/>
								);
							})}
						</div>
					)}
				</div>
			)}

			<AnggaranSetupModal
				key={setupKey}
				open={setupOpen}
				onClose={() => setSetupOpen(false)}
				mode={totalBudget ? 'edit' : 'add'}
				month={month}
				budgets={budgets}
				categories={categories}
				onSaved={() => mutate()}
			/>
		</PageContainer>
	);
}

// ── TypePctCard ───────────────────────────────────────────────────────────────
function TypePctCard({
	bt,
	pct,
	totalAmount,
	onChange,
}: {
	bt: BudgetType;
	pct: number;
	totalAmount: number;
	onChange: (pct: number) => void;
}) {
	const color = BUDGET_TYPE_COLORS[bt];
	const idr = Math.round((totalAmount * pct) / 100);
	return (
		<div
			className="rounded-xl border border-border bg-surface p-4"
			style={{ borderTop: `3px solid ${color}` }}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<span
						className="size-2.5 shrink-0 rounded-full"
						style={{ backgroundColor: color }}
					/>
					<p className="font-medium text-[14px] truncate">
						{BUDGET_TYPE_LABELS[bt]}
					</p>
				</div>
				<div className="flex items-center gap-1.5 shrink-0">
					<input
						type="number"
						min={0}
						max={100}
						value={pct === 0 ? '' : pct}
						placeholder="0"
						onChange={(e) => {
							const v = Math.max(
								0,
								Math.min(100, parseInt(e.target.value, 10) || 0),
							);
							onChange(v);
						}}
						className="w-16 h-11 rounded-lg border border-border bg-background px-2 text-right text-sm tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					<span className="text-sm font-medium text-muted-foreground">%</span>
				</div>
			</div>
			{totalAmount > 0 && (
				<>
					<p className="mt-2 tabular-nums text-[12px] text-muted-foreground">
						= {formatMoney(idr)}
					</p>
					<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full transition-all duration-500"
							style={{
								width: `${Math.min(pct, 100)}%`,
								backgroundColor: color,
							}}
						/>
					</div>
				</>
			)}
		</div>
	);
}

// ── AllocationBanner ──────────────────────────────────────────────────────────
function AllocationBanner({
	totalTypePct,
	totalAmount,
}: {
	totalTypePct: number;
	totalAmount: number;
}) {
	if (totalAmount === 0) return null;
	const isExact = totalTypePct === 100;
	const isOver = totalTypePct > 100;
	return (
		<div
			className={cn(
				'rounded-xl px-4 py-3 text-[13px] font-medium',
				isExact
					? 'bg-success/10 text-success'
					: isOver
						? 'bg-danger/10 text-danger'
						: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
			)}
		>
			{isExact && '✓ Setup terbaik! Total 100%'}
			{!isExact &&
				!isOver &&
				`${totalTypePct}% dari 100% — sisa ${100 - totalTypePct}%`}
			{isOver && `Melebihi 100% sebesar ${totalTypePct - 100}%`}
		</div>
	);
}

// ── CatPctRow ─────────────────────────────────────────────────────────────────
function CatPctRow({
	cat,
	allCategories,
	pct,
	typeAmount,
	onChange,
}: {
	cat: TransactionCategory;
	allCategories: TransactionCategory[];
	pct: number;
	typeAmount: number;
	onChange: (pct: number) => void;
}) {
	const idr = Math.round((typeAmount * pct) / 100);
	return (
		<div className="flex items-center gap-3 py-2.5">
			<div className="min-w-0 flex-1">
				<p className="truncate text-[13px] font-medium">
					{formatCategoryLabel(cat, allCategories)}
				</p>
				{typeAmount > 0 && pct > 0 && (
					<p className="tabular-nums text-[11px] text-muted-foreground">
						= {formatMoney(idr)}
					</p>
				)}
			</div>
			<div className="flex items-center gap-1.5 shrink-0">
				<input
					type="number"
					min={0}
					max={100}
					value={pct === 0 ? '' : pct}
					placeholder="0"
					onChange={(e) => {
						const v = Math.max(
							0,
							Math.min(100, parseInt(e.target.value, 10) || 0),
						);
						onChange(v);
					}}
					className="w-14 h-10 rounded-lg border border-border bg-background px-2 text-right text-sm tabular-nums font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
				/>
				<span className="text-[13px] text-muted-foreground">%</span>
			</div>
		</div>
	);
}

// ── CategoryAccordion ─────────────────────────────────────────────────────────
function CategoryAccordion({
	categories,
	typePcts,
	totalAmount,
	catPcts,
	setCatPcts,
	expandedCatTypes,
	setExpandedCatTypes,
}: {
	categories: TransactionCategory[];
	typePcts: Record<BudgetType, number>;
	totalAmount: number;
	catPcts: Record<string, number>;
	setCatPcts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
	expandedCatTypes: Set<BudgetType>;
	setExpandedCatTypes: React.Dispatch<React.SetStateAction<Set<BudgetType>>>;
}) {
	return (
		<div className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
			{BUDGET_TYPES.map((bt) => {
				const tAmount = Math.round((totalAmount * (typePcts[bt] ?? 0)) / 100);
				const typeCats = categories.filter(
					(c) =>
						c.type === 'expense' &&
						!c.parent_id &&
						c.budget_type === bt &&
						!c.deleted_at,
				);
				const catTotalPct = typeCats.reduce(
					(s, c) => s + (catPcts[`${bt}__${c.id}`] ?? 0),
					0,
				);
				const color = BUDGET_TYPE_COLORS[bt];
				const isExpanded = expandedCatTypes.has(bt);
				const isSkipped = tAmount === 0;
				const isOver = catTotalPct > 100;
				const isExact = catTotalPct === 100;
				return (
					<div key={bt}>
						<button
							type="button"
							onClick={() => {
								if (isSkipped) return;
								setExpandedCatTypes((prev) => {
									const next = new Set(prev);
									if (next.has(bt)) next.delete(bt);
									else next.add(bt);
									return next;
								});
							}}
							disabled={isSkipped}
							className={cn(
								'flex w-full items-center gap-3 px-4 py-3.5 text-left',
								isSkipped && 'opacity-50',
							)}
						>
							<span
								className="size-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: color }}
							/>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<p className="font-medium text-[14px]">
										{BUDGET_TYPE_LABELS[bt]}
									</p>
									{isSkipped && (
										<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
											dilewati
										</span>
									)}
									{!isSkipped && catTotalPct > 0 && (
										<span
											className={cn(
												'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
												isExact
													? 'bg-success/10 text-success'
													: isOver
														? 'bg-danger/10 text-danger'
														: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
											)}
										>
											{catTotalPct}%
										</span>
									)}
								</div>
								<p className="tabular-nums text-[12px] text-muted-foreground">
									{formatMoney(tAmount)}
								</p>
							</div>
							{!isSkipped &&
								(isExpanded ? (
									<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
								) : (
									<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
								))}
						</button>
						{isExpanded && !isSkipped && (
							<div className="border-t border-border bg-muted/30 px-4 divide-y divide-border">
								{typeCats.length === 0 ? (
									<p className="py-3 text-[12px] text-muted-foreground">
										Belum ada kategori untuk {BUDGET_TYPE_LABELS[bt]}.
									</p>
								) : (
									typeCats.map((cat) => (
										<CatPctRow
											key={cat.id}
											cat={cat}
											allCategories={categories}
											pct={catPcts[`${bt}__${cat.id}`] ?? 0}
											typeAmount={tAmount}
											onChange={(v) =>
												setCatPcts((p) => ({ ...p, [`${bt}__${cat.id}`]: v }))
											}
										/>
									))
								)}
								{typeCats.length > 0 && (
									<div
										className={cn(
											'py-2.5 text-[12px] font-medium',
											isExact
												? 'text-success'
												: isOver
													? 'text-danger'
													: 'text-amber-600 dark:text-amber-400',
										)}
									>
										{isExact ? '✓ 100%' : `${catTotalPct}% dari 100%`}
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}

// ── Setup Modal helpers ───────────────────────────────────────────────────────
function initFromBudgets(budgets: Budget[]) {
	const tb = budgets.find(
		(b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === '',
	);
	const total = tb ? parseInt(tb.allocated_amount, 10) : 0;
	const pcts: Record<BudgetType, number> = {
		needs: 0,
		savings: 0,
		wants: 0,
		sedekah: 0,
	};
	const cats: Record<string, number> = {};
	let hasCatBudgets = false;
	for (const bt of BUDGET_TYPES) {
		const typeBudget = budgets.find(
			(b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === bt,
		);
		if (typeBudget && total > 0) {
			pcts[bt] = Math.round(
				(parseInt(typeBudget.allocated_amount, 10) / total) * 100,
			);
		}
		for (const cb of budgets.filter(
			(b) => (b.category_id ?? '') !== '' && (b.budget_type ?? '') === bt,
		)) {
			const typeAmt = Math.round((total * (pcts[bt] ?? 0)) / 100);
			const cbAmt = parseInt(cb.allocated_amount, 10);
			cats[`${bt}__${cb.category_id}`] =
				typeAmt > 0 ? Math.round((cbAmt / typeAmt) * 100) : 0;
			hasCatBudgets = true;
		}
	}
	return { total, pcts, cats, hasCatBudgets };
}

// ── Setup Modal ───────────────────────────────────────────────────────────────
function AnggaranSetupModal({
	open,
	onClose,
	mode,
	month,
	budgets,
	categories,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	mode: 'add' | 'edit';
	month: string;
	budgets: Budget[];
	categories: TransactionCategory[];
	onSaved: () => void;
}) {
	const { trigger: createBudget, isMutating: saving } = useCreateBudget();
	const { trigger: deleteBudget } = useDeleteBudget();

	const init = initFromBudgets(budgets);
	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [totalAmount, setTotalAmount] = useState(init.total);
	const [typePcts, setTypePcts] = useState<Record<BudgetType, number>>(
		init.pcts,
	);
	const [catPcts, setCatPcts] = useState<Record<string, number>>(init.cats);
	const [perCategory, setPerCategory] = useState(init.hasCatBudgets);
	const [expandedCatTypes, setExpandedCatTypes] = useState<Set<BudgetType>>(
		new Set(),
	);

	const totalTypePct = BUDGET_TYPES.reduce(
		(s, bt) => s + (typePcts[bt] ?? 0),
		0,
	);

	function applyTemplate() {
		setTypePcts({ needs: 50, savings: 30, wants: 15, sedekah: 5 });
	}

	const handleSave = useCallback(
		async (skipCategories = false) => {
			try {
				const r0 = await createBudget({
					month,
					category_id: '',
					budget_type: '',
					allocated_amount: totalAmount,
					notes: '',
				});
				if (!r0.ok) {
					toast.error(r0.error);
					return;
				}

				for (const bt of BUDGET_TYPES) {
					const tAmt = Math.round((totalAmount * (typePcts[bt] ?? 0)) / 100);
					const r = await createBudget({
						month,
						category_id: '',
						budget_type: bt,
						allocated_amount: tAmt,
						notes: '',
					});
					if (!r.ok) {
						toast.error(r.error);
						return;
					}
				}

				if (perCategory && !skipCategories) {
					for (const [key, pct] of Object.entries(catPcts)) {
						if (pct <= 0) continue;
						const sep = key.indexOf('__');
						if (sep < 0) continue;
						const bt = key.slice(0, sep) as BudgetType;
						const catId = key.slice(sep + 2);
						const tAmt = Math.round((totalAmount * (typePcts[bt] ?? 0)) / 100);
						const cAmt = Math.round((tAmt * pct) / 100);
						const r = await createBudget({
							month,
							category_id: catId,
							budget_type: bt,
							allocated_amount: cAmt,
							notes: '',
						});
						if (!r.ok) {
							toast.error(r.error);
							return;
						}
					}
				} else {
					const toDelete = budgets
						.filter((b) => (b.category_id ?? '') !== '')
						.map((b) => b.id);
					for (const id of toDelete) await deleteBudget(id);
				}

				toast.success('Anggaran tersimpan');
				onSaved();
				onClose();
			} catch {
				toast.error('Gagal menyimpan anggaran');
			}
		},
		[
			month,
			totalAmount,
			typePcts,
			catPcts,
			perCategory,
			budgets,
			createBudget,
			deleteBudget,
			onSaved,
			onClose,
		],
	);

	const title = `Atur Anggaran — ${month.replace('-', ' / ')}`;

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex flex-col gap-0 p-0 sm:max-w-[560px] max-h-[92dvh] sm:max-h-[85dvh] overflow-hidden">
				<DialogHeader className="shrink-0 border-b border-border px-5 pt-5 pb-4 mb-0">
					<DialogTitle>{title}</DialogTitle>
					{mode === 'add' && (
						<div className="flex items-center gap-2 pt-1">
							{([1, 2, 3] as const).map((s) => (
								<span
									key={s}
									className={cn(
										'size-2 rounded-full transition-colors duration-300',
										step === s
											? 'bg-primary'
											: step > s
												? 'bg-primary/40'
												: 'bg-muted-foreground/30',
									)}
								/>
							))}
							<span className="ml-1 text-[12px] text-muted-foreground">
								Langkah {step} dari 3
							</span>
						</div>
					)}
				</DialogHeader>

				<div className="flex-1 overflow-y-auto">
					{mode === 'add' && step === 1 && (
						<div className="flex flex-col gap-4 px-5 py-6">
							<p className="text-[13px] text-muted-foreground">
								Berapa total pemasukan bulan ini?
							</p>
							<MoneyInput
								value={totalAmount}
								onChange={(v) => setTotalAmount(v ?? 0)}
							/>
							<p className="text-[12px] text-muted-foreground">
								Masukkan total pendapatan yang ingin dianggarkan.
							</p>
						</div>
					)}
					{mode === 'add' && step === 2 && (
						<div className="flex flex-col gap-3 px-5 py-4">
							<p className="text-[13px] text-muted-foreground">
								Bagi ke tipe pengeluaran (total harus 100%)
							</p>
							<button
								type="button"
								onClick={applyTemplate}
								className="self-start rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
								title="50% Kebutuhan / 30% Tabungan / 15% Keinginan / 5% Sedekah"
							>
								50/30/15/5
							</button>
							{BUDGET_TYPES.map((bt) => (
								<TypePctCard
									key={bt}
									bt={bt}
									pct={typePcts[bt] ?? 0}
									totalAmount={totalAmount}
									onChange={(v) => setTypePcts((p) => ({ ...p, [bt]: v }))}
								/>
							))}
							<AllocationBanner
								totalTypePct={totalTypePct}
								totalAmount={totalAmount}
							/>
						</div>
					)}
					{mode === 'add' && step === 3 && (
						<div className="flex flex-col gap-0 py-2">
							<p className="px-5 pb-3 text-[13px] text-muted-foreground">
								Atur alokasi per kategori induk (opsional). Lewati jika tidak
								perlu detail ini.
							</p>
							<CategoryAccordion
								categories={categories}
								typePcts={typePcts}
								totalAmount={totalAmount}
								catPcts={catPcts}
								setCatPcts={setCatPcts}
								expandedCatTypes={expandedCatTypes}
								setExpandedCatTypes={setExpandedCatTypes}
							/>
						</div>
					)}
					{mode === 'edit' && (
						<div className="flex flex-col gap-6 px-5 py-5">
							<div className="flex flex-col gap-2">
								<p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
									Total Anggaran
								</p>
								<MoneyInput
									value={totalAmount}
									onChange={(v) => setTotalAmount(v ?? 0)}
								/>
							</div>
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
										Alokasi Tipe
									</p>
									<button
										type="button"
										onClick={applyTemplate}
										className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
									>
										50/30/15/5
									</button>
								</div>
								{BUDGET_TYPES.map((bt) => (
									<TypePctCard
										key={bt}
										bt={bt}
										pct={typePcts[bt] ?? 0}
										totalAmount={totalAmount}
										onChange={(v) => setTypePcts((p) => ({ ...p, [bt]: v }))}
									/>
								))}
								<AllocationBanner
									totalTypePct={totalTypePct}
									totalAmount={totalAmount}
								/>
							</div>
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
										Alokasi Kategori
									</p>
									<div className="flex items-center gap-1.5">
										<Switch
											id="edit-per-cat"
											checked={perCategory}
											onCheckedChange={setPerCategory}
										/>
										<Label
											htmlFor="edit-per-cat"
											className="cursor-pointer text-[12px] text-muted-foreground"
										>
											Per Kategori
										</Label>
									</div>
								</div>
								{perCategory && (
									<CategoryAccordion
										categories={categories}
										typePcts={typePcts}
										totalAmount={totalAmount}
										catPcts={catPcts}
										setCatPcts={setCatPcts}
										expandedCatTypes={expandedCatTypes}
										setExpandedCatTypes={setExpandedCatTypes}
									/>
								)}
							</div>
						</div>
					)}
				</div>

				<div className="shrink-0 border-t border-border px-5 py-4">
					{mode === 'add' && (
						<div className="flex items-center gap-3">
							{step > 1 ? (
								<Button
									variant="outline"
									size="sm"
									onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
								>
									← Kembali
								</Button>
							) : (
								<Button variant="outline" size="sm" onClick={onClose}>
									Batal
								</Button>
							)}
							<div className="flex-1" />
							{step < 3 && (
								<Button
									onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
									disabled={step === 1 ? totalAmount === 0 : totalTypePct === 0}
								>
									Lanjut →
								</Button>
							)}
							{step === 3 && (
								<>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleSave(true)}
										disabled={saving}
									>
										Lewati
									</Button>
									<Button
										onClick={() => handleSave(false)}
										disabled={saving || totalAmount === 0}
									>
										{saving ? 'Menyimpan…' : 'Simpan ✓'}
									</Button>
								</>
							)}
						</div>
					)}
					{mode === 'edit' && (
						<div className="flex items-center gap-3">
							<Button variant="outline" size="sm" onClick={onClose}>
								Batal
							</Button>
							<div className="flex-1 text-center">
								<p className="tabular-nums text-sm font-semibold">
									{totalTypePct}% dialokasikan
								</p>
							</div>
							<Button
								onClick={() => handleSave(false)}
								disabled={saving || totalAmount === 0}
							>
								{saving ? 'Menyimpan…' : 'Simpan Perubahan'}
							</Button>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
