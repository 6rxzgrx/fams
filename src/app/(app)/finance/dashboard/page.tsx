'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
	Activity,
	ArrowUpRight,
	ChevronRight,
	Coins,
	Eye,
	EyeOff,
	FileText,
	List,
	Plus,
	Receipt,
	Target,
	TrendingDown,
	TrendingUp,
	Wallet,
	type LucideIcon,
} from 'lucide-react';

import { AddTransactionDialog } from '@/components/nav/add-transaction-dialog';
import { PageContainer } from '@/components/layout/page-container';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionItem } from '@/components/finance/transaction-item';
import { CashflowChart } from '@/components/finance/cashflow-chart';
import { IncomeExpenseBars } from '@/components/finance/income-expense-bars';
import { CategoryIcon } from '@/components/finance/category-icon';
import { StatusChip } from '@/components/finance/status-chip';

import { useAccounts } from '@/hooks/use-accounts';
import { useAssets } from '@/hooks/use-assets';
import { useBills } from '@/hooks/use-bills';
import { useBudgets } from '@/hooks/use-budgets';
import { useCategories } from '@/hooks/use-categories';
import { useTransactions } from '@/hooks/use-transactions';
import { usePriceRates } from '@/hooks/use-price-rates';

import { formatMoney, formatMoneyCompact } from '@/lib/money';
import { cn } from '@/lib/utils';
import { getMonthRange, sumByType } from '@/domain/transactions';
import {
	BUDGET_TYPE_LABELS,
	BUDGET_TYPE_COLORS,
} from '@/domain/constants';
import { buildRegistryDataLegacy } from '@/components/finance/asset-registry-shared';
import type { Bill, BudgetType } from '@/domain/types';
import type { Transaction, TransactionCategory } from '@/domain/types';

function currentYM() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isoDate(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ymOf(dateStr: string) {
	return dateStr.slice(0, 7);
}

const MONTH_LABEL_ID = [
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

function fullMonthLabel(ym: string) {
	const [y, m] = ym.split('-').map(Number);
	return `${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m - 1]} ${y}`;
}

export default function RingkasanPage() {
	const month = currentYM();
	const [manualOpen, setManualOpen] = useState(false);

	// Month boundaries
	const [year, mon] = month.split('-').map(Number);
	const { from: monthFrom, to: monthTo } = getMonthRange(year, mon);

	// 6-month window for trend bars
	const sixFrom = (() => {
		const d = new Date(year, mon - 6, 1);
		return isoDate(d);
	})();

	// 30-day window for cashflow chart
	const thirtyFromDate = (() => {
		const d = new Date();
		d.setDate(d.getDate() - 29);
		return d;
	})();
	const thirtyFrom = isoDate(thirtyFromDate);
	const thirtyTo = isoDate(new Date());

	const { accounts, isLoading: accountsLoading } = useAccounts();
	const { assets, isLoading: assetsLoading } = useAssets();
	const { bills, isLoading: billsLoading } = useBills();
	const { categories } = useCategories();
	const { budgets } = useBudgets(month);
	const { rates } = usePriceRates();
	const { transactions: monthTx, isLoading: monthTxLoading } = useTransactions({
		from: monthFrom,
		to: monthTo,
		limit: 1000,
	});
	const { transactions: sixMoTx, isLoading: sixMoTxLoading } = useTransactions({
		from: sixFrom,
		to: monthTo,
		limit: 2000,
	});
	const { transactions: thirtyTx } = useTransactions({
		from: thirtyFrom,
		to: thirtyTo,
		limit: 1000,
	});
	const { transactions: recentTx } = useTransactions({ limit: 5 });

	// ── Aggregates ───────────────────────────────────────────────
	const { liquidItems, nonLiquidItems, totalNilai } = buildRegistryDataLegacy(accounts, assets, rates);

	const liquidAccounts = accounts.filter(
		(a) => a.include_in_saldo !== 'false' && !a.deleted_at,
	);
	// Saldo Tersedia: only accounts included in saldo (for MoneyLeftCard)
	const totalSaldo = liquidAccounts.reduce(
		(sum, a) => sum + (parseInt(a.current_balance, 10) || 0),
		0,
	);
	// Aset Kekayaan breakdown — matches assets page totalNilai components
	const totalLiquid = liquidItems.reduce((sum, i) => sum + i.value, 0);
	const totalAssetValue = nonLiquidItems.reduce((s, i) => {
		if (i.satuan === 'rupiah') return s + i.value;
		if (i.idrValue != null) return s + i.idrValue;
		return s;
	}, 0);

	const aliveAssets = assets.filter((a) => !a.deleted_at);
	const netWorth = totalNilai;
	const monthSums = sumByType(monthTx);
	const netMonth = monthSums.income - monthSums.expense;

	// 30-day cumulative net cashflow series (1 point per day)
	const cashflowSeries = useMemo(() => {
		const days = 30;
		const series: number[] = [];
		let cumulative = 0;
		for (let i = 0; i < days; i++) {
			const d = new Date(thirtyFromDate);
			d.setDate(thirtyFromDate.getDate() + i);
			const key = isoDate(d);
			const day = thirtyTx.filter((t) => t.date === key);
			const net = day.reduce((sum, t) => {
				const amt = parseInt(t.amount, 10) || 0;
				if (t.type === 'income' || t.type === 'refund') return sum + amt;
				if (t.type === 'expense') return sum - amt;
				return sum;
			}, 0);
			cumulative += net;
			series.push(cumulative);
		}
		return series;
	}, [thirtyTx, thirtyFromDate]);

	// 6-month income/expense bars
	const monthsTrend = useMemo(() => {
		const slots: { m: string; key: string }[] = [];
		for (let i = 5; i >= 0; i--) {
			const d = new Date(year, mon - 1 - i, 1);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
			slots.push({ m: MONTH_LABEL_ID[d.getMonth()], key });
		}
		const incMap = new Map<string, number>(slots.map((s) => [s.key, 0]));
		const expMap = new Map<string, number>(slots.map((s) => [s.key, 0]));
		for (const tx of sixMoTx) {
			const key = ymOf(tx.date);
			if (!incMap.has(key)) continue;
			const amt = parseInt(tx.amount, 10) || 0;
			if (tx.type === 'income' || tx.type === 'refund')
				incMap.set(key, (incMap.get(key) ?? 0) + amt);
			else if (tx.type === 'expense')
				expMap.set(key, (expMap.get(key) ?? 0) + amt);
		}
		return slots.map((s) => ({
			m: s.m,
			inc: incMap.get(s.key) ?? 0,
			exp: expMap.get(s.key) ?? 0,
			key: s.key,
		}));
	}, [sixMoTx, year, mon]);

	// Budget rollup — category-level when set, otherwise type-level fallback
	const budgetRows = useMemo(() => {
		const spentBy = new Map<string, number>();
		for (const tx of monthTx) {
			if (tx.type !== 'expense') continue;
			const id = tx.category_id;
			if (!id) continue;
			spentBy.set(id, (spentBy.get(id) ?? 0) + (parseInt(tx.amount, 10) || 0));
		}

		// Roll up direct + sub-category spending for a given parent category id
		const catSpent = (catId: string) =>
			categories
				.filter(
					(c) => c.id === catId || (c.parent_id === catId && !c.deleted_at),
				)
				.reduce((sum, c) => sum + (spentBy.get(c.id) ?? 0), 0);

		const catBudgets = budgets.filter((b) => !!b.category_id);
		if (catBudgets.length > 0) {
			return catBudgets.map((b) => {
				const cat = categories.find((c) => c.id === b.category_id);
				return {
					id: b.id,
					label: cat?.name ?? 'Kategori',
					icon: cat?.icon ?? 'tag',
					color: cat?.color || '#64748b',
					allocated: parseInt(b.allocated_amount, 10) || 0,
					spent: catSpent(b.category_id!),
				};
			});
		}

		// Fallback: show type-level budgets if no per-category budgets are set
		return budgets
			.filter((b) => !b.category_id && !!b.budget_type)
			.map((b) => {
				const bt = b.budget_type as BudgetType;
				const typeCatIds = categories
					.filter(
						(c) =>
							c.type === 'expense' &&
							!c.parent_id &&
							c.budget_type === bt &&
							!c.deleted_at,
					)
					.map((c) => c.id);
				const spent = typeCatIds.reduce((sum, id) => sum + catSpent(id), 0);
				return {
					id: b.id,
					label: BUDGET_TYPE_LABELS[bt] ?? bt,
					icon: 'tag',
					color: BUDGET_TYPE_COLORS[bt] ?? '#64748b',
					allocated: parseInt(b.allocated_amount, 10) || 0,
					spent,
				};
			});
	}, [budgets, monthTx, categories]);

	// Use the overall budget row as the authoritative total to avoid rounding drift
	const overallBudgetRow = budgets.find(
		(b) => (b.category_id ?? '') === '' && (b.budget_type ?? '') === '',
	);
	const totalBudget = overallBudgetRow
		? parseInt(overallBudgetRow.allocated_amount, 10) || 0
		: budgetRows.reduce((s, b) => s + b.allocated, 0);
	const totalBudgetSpent = budgetRows.reduce((s, b) => s + b.spent, 0);
	const budgetRemaining = totalBudget - totalBudgetSpent;

	return (
		<PageContainer className="space-y-5 lg:space-y-6">
			{/* ─── Header ───────────────────────────────────────────── */}
			<header className="flex items-end justify-between gap-3">
				<div className="min-w-0">
					<h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
						Ringkasan Keuangan
					</h1>
					<p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
						Money is money, but not all money is the same. So control!
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<button
						type="button"
						onClick={() => setManualOpen(true)}
						className="hidden h-10 items-center gap-2 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground transition-opacity hover:opacity-90 lg:inline-flex"
					>
						<Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
						Tambah transaksi
					</button>
				</div>
			</header>

			{/* ─── Hero: money left + total kekayaan ────── */}
			{/* Mobile: horizontal snap scroll; Desktop: 3fr/1fr grid */}
			<div className="flex snap-x snap-mandatory overflow-x-auto gap-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-[3fr_1fr] lg:overflow-visible lg:items-stretch">
				<div className="w-[calc(100%-2rem)] shrink-0 snap-start lg:w-auto">
					<MoneyLeftCard
						totalLiquid={totalSaldo}
						accounts={liquidAccounts}
						totalBudget={totalBudget}
						totalBudgetSpent={totalBudgetSpent}
						incomeMonth={monthSums.income}
						expenseMonth={monthSums.expense}
						monthLabel={fullMonthLabel(month)}
						loading={accountsLoading}
					/>
				</div>
				<div className="w-[calc(100%-2rem)] shrink-0 snap-start lg:w-auto">
					<TotalKekayaanCard
						netWorth={netWorth}
						totalLiquid={totalLiquid}
						totalAssetValue={totalAssetValue}
						netMonth={netMonth}
						loading={accountsLoading || assetsLoading}
					/>
				</div>
			</div>

			{/* ─── Sub-pages grid (web) / scroller (mobile) ─────────── */}
			<SubPagesNav
				liquid={totalLiquid}
				assets={totalAssetValue}
				accountsCount={liquidAccounts.length}
				assetsCount={aliveAssets.length}
				txCount={monthTx.length}
				netMonth={netMonth}
				totalBudget={totalBudget}
				budgetSpent={totalBudgetSpent}
			/>

			{/* Card grid — 2 independent columns on desktop */}
			<div className="space-y-4 lg:flex lg:items-start lg:gap-5 lg:space-y-0">
				{/* Left col (3fr): Arus Kas → Anggaran → Masuk vs Keluar */}
				<div className="space-y-4 lg:flex-[3] lg:space-y-5">
					<CashflowCard series={cashflowSeries} netMonth={netMonth} />
					<BudgetCard
						rows={budgetRows}
						totalBudget={totalBudget}
						totalSpent={totalBudgetSpent}
						remaining={budgetRemaining}
						monthLabel={fullMonthLabel(month)}
					/>
					<IncomeExpenseCard
						months={monthsTrend}
						netMonth={netMonth}
						loading={sixMoTxLoading}
					/>
				</div>

				{/* Right col (2fr): Tagihan → Transaksi Terbaru */}
				<div className="space-y-4 lg:flex-[2] lg:space-y-5">
					<BillsCard bills={bills} isLoading={billsLoading} />
					<RecentTxCard
						transactions={recentTx}
						categories={categories}
						loading={monthTxLoading}
					/>
				</div>
			</div>

			<AddTransactionDialog open={manualOpen} onOpenChange={setManualOpen} />
		</PageContainer>
	);
}

/* ─────────────────────────────────────────────────────────────
   MoneyLeftCard — 3/4 lime hero: Saldo + Anggaran + P&L
   ──────────────────────────────────────────────────────────── */
function MoneyLeftCard({
	totalLiquid,
	accounts,
	totalBudget,
	totalBudgetSpent,
	incomeMonth,
	expenseMonth,
	monthLabel,
	loading,
}: {
	totalLiquid: number;
	accounts: ReturnType<typeof useAccounts>['accounts'];
	totalBudget: number;
	totalBudgetSpent: number;
	incomeMonth: number;
	expenseMonth: number;
	monthLabel: string;
	loading: boolean;
}) {
	const budgetRemaining = totalBudget - totalBudgetSpent;
	const sisaPct =
		totalBudget > 0
			? Math.max(0, Math.min(100, (budgetRemaining / totalBudget) * 100))
			: 0;
	const spentPct = 100 - sisaPct;
	const ringR = 28;
	const ringC = 2 * Math.PI * ringR;
	const dashLen = (sisaPct / 100) * ringC;

	const visible3 = accounts.slice(0, 3);
	const extra = accounts.length > 3 ? accounts.length - 3 : 0;

	return (
		<div className="bg-hero-positive relative overflow-hidden rounded-xl p-5 lg:p-7">
			{/* Header */}
			<div className="relative flex items-center justify-between">
				<p className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-70">
					Uang Tersedia · {monthLabel}
				</p>
				<span className="inline-flex items-center gap-1.5 rounded-pill bg-black/10 px-2.5 py-1 text-[10.5px] font-bold">
					<span className="size-1.5 rounded-full bg-current" />
					{budgetRemaining >= 0 ? 'Aman' : 'Melebihi anggaran'}
				</span>
			</div>

			{/* Top 2-col: Saldo Tersedia | Sisa Anggaran */}
			<div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
				{/* Saldo Tersedia — dark inset block */}
				<div className="relative overflow-hidden rounded-2xl bg-black/90 p-4 lg:p-5">
					<div className="flex items-center justify-between">
						<p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/55">
							Saldo Tersedia
						</p>
						<span className="flex size-6 items-center justify-center rounded-lg bg-accent/20">
							<Wallet className="size-3 text-accent" strokeWidth={2} />
						</span>
					</div>
					{loading ? (
						<div className="mt-2 h-9 w-44 animate-pulse rounded-md bg-white/10" />
					) : (
						<p className="mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight text-white/95 lg:text-[32px]">
							{formatMoney(totalLiquid)}
						</p>
					)}
					<div className="mt-2.5 flex flex-wrap gap-1.5">
						{visible3.map((a) => {
							const bal = parseInt(a.current_balance, 10) || 0;
							return (
								<span
									key={a.id}
									className="inline-flex items-center gap-1.5 rounded-pill border border-white/8 bg-white/6 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/80"
								>
									<span
										className="size-1.5 rounded-full"
										style={{ background: a.color || '#93C5FD' }}
									/>
									{a.name.split(' ')[0]}
									<span className="text-white/45">
										{formatMoneyCompact(bal)}
									</span>
								</span>
							);
						})}
						{extra > 0 && (
							<span className="px-1 py-0.5 text-[10px] font-bold text-white/40">
								+{extra} lagi
							</span>
						)}
					</div>
				</div>

				{/* Sisa Anggaran — translucent with ring meter */}
				<div className="relative overflow-hidden rounded-2xl border border-black/10 bg-black/6 p-4 lg:p-5">
					<div className="flex items-center justify-between">
						<p className="text-[10.5px] font-bold uppercase tracking-[0.08em] opacity-75">
							Sisa Anggaran Bulan Ini
						</p>
						{totalBudget > 0 && (
							<p className="text-[10.5px] font-bold tabular-nums opacity-55">
								/ {formatMoneyCompact(totalBudget)}
							</p>
						)}
					</div>
					{totalBudget === 0 ? (
						<p className="mt-4 text-sm font-semibold opacity-60">
							Belum ada anggaran
						</p>
					) : (
						<div className="mt-2 flex items-center gap-3">
							<svg
								width="68"
								height="68"
								viewBox="0 0 68 68"
								className="shrink-0"
								aria-hidden
							>
								<circle
									cx="34"
									cy="34"
									r={ringR}
									fill="none"
									stroke="rgba(10,10,11,0.14)"
									strokeWidth="6"
								/>
								<circle
									cx="34"
									cy="34"
									r={ringR}
									fill="none"
									stroke="currentColor"
									strokeWidth="6"
									strokeLinecap="round"
									strokeDasharray={`${dashLen} ${ringC}`}
									transform="rotate(-90 34 34)"
								/>
								<text
									x="34"
									y="38"
									textAnchor="middle"
									fontSize="13"
									fontWeight="700"
									fill="currentColor"
									fontFamily="Geist, sans-serif"
								>
									{sisaPct.toFixed(0)}%
								</text>
							</svg>
							<div className="min-w-0">
								<p
									className={cn(
										'text-[28px] font-bold tabular-nums leading-none tracking-tight lg:text-[32px]',
										budgetRemaining < 0 && 'opacity-70',
									)}
								>
									{formatMoneyCompact(Math.abs(budgetRemaining))}
								</p>
								<p className="mt-1.5 text-[10.5px] font-bold opacity-65">
									Terpakai {formatMoneyCompact(totalBudgetSpent)} ·{' '}
									{spentPct.toFixed(0)}%
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Bottom pair: Pengeluaran | Pemasukan */}
			<div className="relative mt-3 grid grid-cols-2 gap-3">
				{(
					[
						{
							label: 'Pengeluaran',
							value: expenseMonth,
							Icon: TrendingDown,
							iconCls: 'text-danger',
						},
						{
							label: 'Pemasukan',
							value: incomeMonth,
							Icon: TrendingUp,
							iconCls: 'text-success',
						},
					] as const
				).map(({ label, value, Icon, iconCls }) => (
					<div
						key={label}
						className="flex items-center gap-3 rounded-xl border border-black/10 bg-black/6 px-3.5 py-3"
					>
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/85">
							<Icon
								className={cn('size-3.5', iconCls)}
								strokeWidth={2}
								aria-hidden
							/>
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-[9.5px] font-bold uppercase tracking-[0.08em] opacity-65">
								{label} bulan ini
							</p>
							<p className="mt-0.5 text-[17px] font-bold tabular-nums leading-tight tracking-tight lg:text-[20px]">
								{loading ? '—' : formatMoneyCompact(value)}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   TotalKekayaanCard — 1/4 dark card: net worth + Likuid/Aset
   ──────────────────────────────────────────────────────────── */
function TotalKekayaanCard({
	netWorth,
	totalLiquid,
	totalAssetValue,
	netMonth,
	loading,
}: {
	netWorth: number;
	totalLiquid: number;
	totalAssetValue: number;
	netMonth: number;
	loading: boolean;
}) {
	const [hidden, setHidden] = useState(false);
	const positive = netMonth >= 0;

	return (
		<div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-5 lg:p-6">
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						'radial-gradient(ellipse 80% 50% at 100% 0%, rgba(197,242,62,0.10), transparent 60%)',
				}}
			/>

			{/* Header */}
			<div className="relative flex items-center justify-between">
				<p className="text-eyebrow text-muted-foreground">Aset Kekayaan</p>
				<button
					type="button"
					onClick={() => setHidden((h) => !h)}
					aria-label={hidden ? 'Tampilkan kekayaan' : 'Sembunyikan kekayaan'}
					className="flex size-7 items-center justify-center rounded-lg border border-border bg-muted"
				>
					{hidden ? (
						<Eye
							className="size-3.5 text-muted-foreground"
							strokeWidth={1.75}
						/>
					) : (
						<EyeOff
							className="size-3.5 text-muted-foreground"
							strokeWidth={1.75}
						/>
					)}
				</button>
			</div>

			{/* Net worth value */}
			<div className="relative mt-2.5">
				{loading ? (
					<Skeleton className="h-9 w-44" />
				) : hidden ? (
					<p className="text-[26px] font-bold tracking-tight text-muted-foreground">
						Rp ••••••
					</p>
				) : (
					<p className="text-[26px] font-bold tabular-nums leading-none tracking-tight lg:text-[30px]">
						{formatMoney(netWorth)}
					</p>
				)}
			</div>

			{/* Net month trend pill */}
			<div className="relative mt-2.5">
				<span
					className={cn(
						'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10.5px] font-bold',
						positive
							? 'bg-success-soft text-success'
							: 'bg-danger-soft text-danger',
					)}
				>
					{positive ? (
						<TrendingUp className="size-3" strokeWidth={2.25} aria-hidden />
					) : (
						<TrendingDown className="size-3" strokeWidth={2.25} aria-hidden />
					)}
					Net bulan ini {positive ? '+' : '−'}
					{formatMoneyCompact(Math.abs(netMonth))}
				</span>
			</div>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Likuid / Aset breakdown */}
			<div className="relative mt-4 space-y-2.5 border-t border-border pt-4">
				{[
					{ label: 'Likuid', value: totalLiquid, dotCls: 'bg-accent' },
					{ label: 'Non Likuid', value: totalAssetValue, dotCls: 'bg-info' },
				].map(({ label, value, dotCls }) => (
					<div key={label} className="flex items-center gap-2.5">
						<span className={cn('size-2 shrink-0 rounded-[3px]', dotCls)} />
						<span className="flex-1 text-[11.5px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
							{label}
						</span>
						<span className="text-[13px] font-bold tabular-nums">
							{hidden ? (
								<span className="text-muted-foreground">••••</span>
							) : (
								formatMoneyCompact(value)
							)}
						</span>
					</div>
				))}
				{/* Proportion bar */}
				<div className="flex h-1.5 gap-0.5 overflow-hidden rounded-pill">
					<div className="bg-accent" style={{ flex: totalLiquid || 1 }} />
					<div className="bg-info" style={{ flex: totalAssetValue || 1 }} />
				</div>
			</div>
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   Sub-pages nav: 5 cards (web grid / mobile horizontal scroll)
   ──────────────────────────────────────────────────────────── */
type SubPage = {
	href: string;
	label: string;
	sub: string;
	stat: string;
	tone: 'accent' | 'info' | 'success' | 'warning' | 'neutral';
	Icon: LucideIcon;
};

function SubPagesNav({
	liquid,
	assets,
	accountsCount,
	assetsCount,
	txCount,
	netMonth,
	totalBudget,
	budgetSpent,
}: {
	liquid: number;
	assets: number;
	accountsCount: number;
	assetsCount: number;
	txCount: number;
	netMonth: number;
	totalBudget: number;
	budgetSpent: number;
}) {
	const budgetRemaining = totalBudget - budgetSpent;
	const budgetPct =
		totalBudget > 0 ? Math.round((budgetSpent / totalBudget) * 100) : 0;

	const items: SubPage[] = [
		{
			href: '/finance/transactions',
			label: 'Transaksi',
			sub: `${txCount} bulan ini`,
			stat: `${netMonth >= 0 ? '+' : '−'}${formatMoneyCompact(Math.abs(netMonth))}`,
			tone: netMonth >= 0 ? 'success' : 'warning',
			Icon: List,
		},
		{
			href: '/finance/anggaran',
			label: 'Anggaran',
			sub: totalBudget > 0 ? `${budgetPct}% terpakai` : 'Belum diatur',
			stat:
				totalBudget > 0
					? budgetRemaining >= 0
						? formatMoneyCompact(budgetRemaining)
						: 'Lewat'
					: 'Atur',
			tone:
				totalBudget === 0
					? 'neutral'
					: budgetRemaining >= 0
						? 'success'
						: 'warning',
			Icon: Target,
		},
		{
			href: '/finance/assets',
			label: 'Aset',
			sub: `${accountsCount} likuid · ${assetsCount} non-likuid`,
			stat: formatMoneyCompact(liquid + assets),
			tone: 'accent',
			Icon: Coins,
		},
		{
			href: '/finance/bills',
			label: 'Tagihan',
			sub: '30 hari ke depan',
			stat: 'Lihat',
			tone: 'neutral',
			Icon: Receipt,
		},
		{
			href: '/finance/reports',
			label: 'Laporan',
			sub: 'Bulanan & arus kas',
			stat: 'Lihat',
			tone: 'neutral',
			Icon: Activity,
		},
	];

	return (
		<section aria-label="Menu Keuangan">
			<p className="text-eyebrow mb-2 px-1 text-muted-foreground lg:hidden">
				Menu Keuangan
			</p>
			{/* Mobile: 2+2+1 grid; Web: 5-column */}
			<div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5 lg:gap-3">
				{items.map((p, idx) => (
					<Link
						key={p.href}
						href={p.href}
						className={cn(
							'group flex flex-col gap-3 rounded-lg border border-border bg-surface p-3.5 transition-colors',
							'hover:border-border-strong lg:p-4',
							idx === 4 && 'col-span-2 lg:col-span-1',
						)}
					>
						<div className="flex items-start justify-between gap-2">
							<span className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground">
								<p.Icon className="size-4" strokeWidth={2} aria-hidden="true" />
							</span>
							<SubPagePill tone={p.tone}>{p.stat}</SubPagePill>
						</div>
						<div>
							<p className="text-[13px] font-semibold lg:text-sm">{p.label}</p>
							<p className="mt-0.5 truncate text-[11.5px] font-medium text-muted-foreground">
								{p.sub}
							</p>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}

function SubPagePill({
	tone,
	children,
}: {
	tone: SubPage['tone'];
	children: React.ReactNode;
}) {
	const styles = {
		accent: 'bg-accent-soft text-foreground',
		info: 'bg-info-soft text-info',
		success: 'bg-success-soft text-success',
		warning: 'bg-warning-soft text-warning',
		neutral: 'bg-muted text-muted-foreground',
	}[tone];
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-pill px-2 py-0.5 text-[10.5px] font-bold tabular-nums',
				styles,
			)}
		>
			{children}
		</span>
	);
}

/* ─────────────────────────────────────────────────────────────
   Card wrappers
   ──────────────────────────────────────────────────────────── */
function Card({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				'rounded-lg border border-border bg-surface p-5 lg:p-6',
				className,
			)}
		>
			{children}
		</div>
	);
}

function CardHead({
	eyebrow,
	title,
	actionHref,
	actionLabel,
}: {
	eyebrow?: string;
	title: string;
	actionHref?: string;
	actionLabel?: string;
}) {
	return (
		<div className="mb-4 flex items-end justify-between gap-3">
			<div className="min-w-0">
				{eyebrow && (
					<p className="text-eyebrow text-muted-foreground">{eyebrow}</p>
				)}
				<h3 className="mt-0.5 truncate text-[15px] font-semibold tracking-tight">
					{title}
				</h3>
			</div>
			{actionHref && actionLabel && (
				<Link
					href={actionHref}
					className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
				>
					{actionLabel}
					<ChevronRight
						className="size-3.5"
						strokeWidth={2.25}
						aria-hidden="true"
					/>
				</Link>
			)}
		</div>
	);
}

/* ─────────────────────────────────────────────────────────────
   Cashflow card
   ──────────────────────────────────────────────────────────── */
function CashflowCard({
	series,
	netMonth,
}: {
	series: number[];
	netMonth: number;
}) {
	const positive = netMonth >= 0;
	return (
		<Card>
			<div className="mb-3 flex items-end justify-between gap-3">
				<div>
					<p className="text-eyebrow text-muted-foreground">
						Arus kas · 30 hari
					</p>
					<div className="mt-1 flex items-baseline gap-2">
						<p className="text-display !text-[24px] tabular-nums lg:!text-[28px]">
							{positive ? '+' : '−'}
							{formatMoneyCompact(Math.abs(netMonth))}
						</p>
						<span
							className={cn(
								'inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10.5px] font-bold',
								positive
									? 'bg-success-soft text-success'
									: 'bg-danger-soft text-danger',
							)}
						>
							{positive ? (
								<TrendingUp className="size-3" strokeWidth={2.25} />
							) : (
								<TrendingDown className="size-3" strokeWidth={2.25} />
							)}
							{positive ? 'Positif' : 'Negatif'}
						</span>
					</div>
				</div>
			</div>
			<CashflowChart series={series} height={140} positive={positive} />
			<div className="mt-2 flex justify-between text-[10.5px] font-medium text-muted-foreground">
				<span>30 hari lalu</span>
				<span>Hari ini</span>
			</div>
		</Card>
	);
}

/* ─────────────────────────────────────────────────────────────
   Bills card
   ──────────────────────────────────────────────────────────── */
function billDueStatus(dateStr: string): 'overdue' | 'due-soon' | 'unpaid' {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(dateStr);
	due.setHours(0, 0, 0, 0);
	const diff = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
	if (diff < 0) return 'overdue';
	if (diff <= 7) return 'due-soon';
	return 'unpaid';
}

function formatBillDue(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
		});
	} catch {
		return dateStr;
	}
}

function BillsCard({ bills, isLoading }: { bills: Bill[]; isLoading: boolean }) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const in30 = new Date(today);
	in30.setDate(today.getDate() + 30);

	const upcoming = bills
		.filter((b) => {
			if (b.deleted_at) return false;
			const due = new Date(b.due_date);
			due.setHours(0, 0, 0, 0);
			return due <= in30;
		})
		.sort((a, b) => a.due_date.localeCompare(b.due_date))
		.slice(0, 5);

	return (
		<Card>
			<CardHead
				eyebrow="30 hari ke depan"
				title="Tagihan"
				actionHref="/finance/bills"
				actionLabel="Semua"
			/>
			{isLoading ? (
				<div className="space-y-3">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-10 w-full" />
					))}
				</div>
			) : upcoming.length === 0 ? (
				<div className="flex flex-col items-center py-6 text-center">
					<span className="mb-2 inline-flex size-10 items-center justify-center rounded-pill bg-muted">
						<Receipt
							className="size-5 text-muted-foreground"
							strokeWidth={1.75}
							aria-hidden="true"
						/>
					</span>
					<p className="text-sm font-semibold">Tidak ada tagihan</p>
					<p className="mt-1 max-w-[200px] text-[12.5px] text-muted-foreground">
						Tidak ada tagihan dalam 30 hari ke depan.
					</p>
					<Link
						href="/finance/bills"
						className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-foreground hover:underline"
					>
						Atur tagihan <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
					</Link>
				</div>
			) : (
				<ul className="divide-y divide-border">
					{upcoming.map((bill) => (
						<li key={bill.id} className="flex items-center gap-3 py-3">
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-semibold">{bill.name}</p>
								<p className="text-[11.5px] text-muted-foreground">
									{formatBillDue(bill.due_date)}
								</p>
							</div>
							<div className="shrink-0 text-right">
								<p className="mb-1 text-[13px] font-bold tabular-nums">
									{formatMoneyCompact(parseInt(bill.amount, 10) || 0)}
								</p>
								<StatusChip status={billDueStatus(bill.due_date)} />
							</div>
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}

/* ─────────────────────────────────────────────────────────────
   Budget card
   ──────────────────────────────────────────────────────────── */
function BudgetCard({
	rows,
	totalBudget,
	totalSpent,
	remaining,
	monthLabel,
}: {
	rows: {
		id: string;
		label: string;
		icon: string;
		color: string;
		allocated: number;
		spent: number;
	}[];
	totalBudget: number;
	totalSpent: number;
	remaining: number;
	monthLabel: string;
}) {
	const pct =
		totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

	if (rows.length === 0) {
		return (
			<Card>
				<CardHead
					eyebrow={monthLabel}
					title="Anggaran bulanan"
					actionHref="/finance/anggaran"
					actionLabel="Atur"
				/>
				<div className="flex flex-col items-center py-8 text-center">
					<span className="mb-2 inline-flex size-10 items-center justify-center rounded-pill bg-muted">
						<FileText
							className="size-5 text-muted-foreground"
							strokeWidth={1.75}
						/>
					</span>
					<p className="text-sm font-semibold">Belum ada anggaran</p>
					<p className="mt-1 max-w-[260px] text-[12.5px] text-muted-foreground">
						Atur anggaran per kategori untuk melihat sisa di sini.
					</p>
					<Link
						href="/finance/anggaran"
						className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-foreground hover:underline"
					>
						Atur anggaran{' '}
						<ArrowUpRight className="size-3.5" strokeWidth={2.25} />
					</Link>
				</div>
			</Card>
		);
	}

	return (
		<Card>
			<CardHead
				eyebrow={monthLabel}
				title="Anggaran bulanan"
				actionHref="/finance/anggaran"
				actionLabel="Atur"
			/>

			<div className="flex items-baseline gap-2">
				<p className="text-display !text-[22px] tabular-nums lg:!text-[26px]">
					{formatMoneyCompact(totalSpent)}
				</p>
				<p className="text-[13px] font-semibold text-muted-foreground tabular-nums">
					/ {formatMoneyCompact(totalBudget)}
				</p>
			</div>
			<p
				className={cn(
					'mt-1 text-[12px] font-semibold',
					remaining >= 0 ? 'text-success' : 'text-danger',
				)}
			>
				{remaining >= 0
					? `Sisa ${formatMoney(remaining)} · ${(100 - pct).toFixed(0)}% anggaran`
					: `Lebih ${formatMoney(-remaining)}`}
			</p>

			{/* Segmented bar */}
			<div className="mt-4 flex gap-[3px]">
				{rows.map((r) => {
					const cpct =
						r.allocated > 0 ? Math.min(100, (r.spent / r.allocated) * 100) : 0;
					return (
						<div
							key={r.id}
							className="h-2 flex-1 overflow-hidden rounded-[3px] bg-muted"
							style={{ flex: r.allocated || 1 }}
						>
							<div
								className="h-full rounded-[3px]"
								style={{
									width: `${cpct}%`,
									background: r.spent > r.allocated ? 'var(--danger)' : r.color,
								}}
							/>
						</div>
					);
				})}
			</div>

			{/* Legend rows */}
			<div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-x-6">
				{rows.map((r) => {
					const ov = r.spent > r.allocated;
					const cpct =
						r.allocated > 0 ? Math.min(100, (r.spent / r.allocated) * 100) : 0;
					return (
						<div key={r.id} className="flex items-center gap-3">
							<span
								className="flex size-7 shrink-0 items-center justify-center rounded-md"
								style={{ background: `${r.color}1f`, color: r.color }}
							>
								<CategoryIcon icon={r.icon} className="size-3.5" />
							</span>
							<div className="min-w-0 flex-1">
								<div className="flex items-center justify-between gap-2">
									<span className="truncate text-[12.5px] font-semibold">
										{r.label}
									</span>
									<span
										className={cn(
											'shrink-0 text-[11px] font-bold tabular-nums',
											ov ? 'text-danger' : 'text-muted-foreground',
										)}
									>
										{cpct.toFixed(0)}%
									</span>
								</div>
								<div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full"
										style={{
											width: `${cpct}%`,
											background: ov ? 'var(--danger)' : r.color,
										}}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}

/* ─────────────────────────────────────────────────────────────
   Income vs Expense bar chart
   ──────────────────────────────────────────────────────────── */
function IncomeExpenseCard({
	months,
	netMonth,
	loading,
}: {
	months: { m: string; inc: number; exp: number }[];
	netMonth: number;
	loading?: boolean;
}) {
	return (
		<Card>
			<CardHead
				eyebrow="6 bulan terakhir"
				title="Masuk vs Keluar"
				actionHref="/finance/reports"
				actionLabel="Laporan"
			/>
			<div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] font-semibold">
				<span className="inline-flex items-center gap-1.5">
					<span className="size-2.5 rounded-[3px] bg-success" /> Masuk
				</span>
				<span className="inline-flex items-center gap-1.5">
					<span className="size-2.5 rounded-[3px] bg-danger" /> Keluar
				</span>
				<span className="ml-auto text-muted-foreground">
					Net bulan ini ·{' '}
					<span
						className={cn(
							'font-bold',
							netMonth >= 0 ? 'text-success' : 'text-danger',
						)}
					>
						{netMonth >= 0 ? '+' : '−'}
						{formatMoneyCompact(Math.abs(netMonth))}
					</span>
				</span>
			</div>
			{loading ? (
				<Skeleton className="h-[200px] w-full rounded-md" />
			) : (
				<IncomeExpenseBars months={months} height={200} />
			)}
		</Card>
	);
}

/* ─────────────────────────────────────────────────────────────
   Recent transactions card
   ──────────────────────────────────────────────────────────── */
function RecentTxCard({
	transactions,
	categories,
	loading,
}: {
	transactions: Transaction[];
	categories: TransactionCategory[];
	loading: boolean;
}) {
	return (
		<Card>
			<CardHead
				eyebrow="Lintas akun"
				title="Transaksi terbaru"
				actionHref="/finance/transactions"
				actionLabel="Semua"
			/>
			{loading ? (
				<div className="space-y-3">
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-10 w-full" />
					))}
				</div>
			) : transactions.length === 0 ? (
				<p className="py-6 text-center text-[12.5px] text-muted-foreground">
					Belum ada transaksi.
				</p>
			) : (
				<ul className="divide-y divide-border">
					{transactions.slice(0, 5).map((tx) => (
						<li key={tx.id} className="py-1">
							<TransactionItem transaction={tx} categories={categories} />
						</li>
					))}
				</ul>
			)}
		</Card>
	);
}
