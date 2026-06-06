'use client';

import { useState, useMemo } from 'react';
import {
	Plus,
	ArrowLeftRight,
	Trash2,
	TrendingUp,
	TrendingDown,
	Calendar,
	CalendarDays,
	Wallet,
	Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/sections/empty-state';
import { ErrorState } from '@/components/sections/error-state';
import { TransactionItem } from '@/components/finance/transaction-item';
import { TransactionForm } from '@/components/finance/transaction-form';
import { MoneyDisplay } from '@/components/finance/money-display';
import { MonthPicker } from '@/components/finance/month-picker';
import { AccountOption } from '@/components/finance/account-option';
import { getRangeForPreset } from '@/components/finance/period-picker';
import type {
	PeriodPreset,
	DateRange,
} from '@/components/finance/period-picker';
import {
	useTransactions,
	useCreateTransaction,
	useUpdateTransaction,
	useDeleteTransaction,
} from '@/hooks/use-transactions';
import { useCategories } from '@/hooks/use-categories';
import { useAccounts } from '@/hooks/use-accounts';
import { groupByDate, getMonthRange } from '@/domain/transactions';
import { formatMoneyCompact } from '@/lib/money';
import type { Transaction, CreateTransactionInput } from '@/domain/types';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';

// ─── Types ───────────────────────────────────────────────────────────────────

type TypeFilter = 'all' | 'income' | 'expense';

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
	{ id: 'all', label: 'Semua' },
	{ id: 'income', label: 'Pemasukan' },
	{ id: 'expense', label: 'Pengeluaran' },
];

const TYPE_PILL: Record<string, { label: string; cls: string }> = {
	income: { label: 'Masuk', cls: 'bg-success-soft text-success' },
	refund: { label: 'Refund', cls: 'bg-success-soft text-success' },
	expense: { label: 'Keluar', cls: 'bg-danger-soft text-danger' },
	transfer: { label: 'Transfer', cls: 'bg-info-soft text-info' },
	adjustment: { label: 'Sesuai', cls: 'bg-warning-soft text-warning' },
};

const PRESET_LABELS: Record<PeriodPreset, string> = {
	this_month: 'Bulan ini',
	last_month: 'Bulan lalu',
	'3_months': '3 bulan lalu',
	'6_months': '6 bulan lalu',
	custom: 'Rentang custom',
};

function currentYM() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function thisMonthRange(): DateRange {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth() + 1;
	const pad = (n: number) => String(n).padStart(2, '0');
	const last = new Date(y, m, 0).getDate();
	return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` };
}

function idrFmt(n: number) {
	return new Intl.NumberFormat('id-ID').format(n);
}

function dayNet(txs: Transaction[]) {
	return txs.reduce((s, t) => {
		const amt = parseInt(t.amount, 10);
		if (t.type === 'income' || t.type === 'refund') return s + amt;
		if (t.type === 'expense') return s - amt;
		return s;
	}, 0);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function TxListSkeleton() {
	const row = (w1: string, w2: string) => (
		<div className="flex items-center gap-3 px-5 py-3 lg:px-0">
			<Skeleton className="size-9 shrink-0 rounded-full" />
			<div className="flex-1 space-y-1.5">
				<Skeleton className={`h-3.5 rounded ${w1}`} />
				<Skeleton className={`h-3 rounded ${w2}`} />
			</div>
			<Skeleton className="h-4 w-20 rounded" />
		</div>
	);
	return (
		<div>
			<div className="px-5 pb-1 pt-3 lg:px-0">
				<Skeleton className="h-3.5 w-32 rounded" />
			</div>
			<div className="divide-y divide-border">
				{row('w-36', 'w-24')}
				{row('w-28', 'w-20')}
				{row('w-40', 'w-16')}
			</div>
			<div className="px-5 pb-1 pt-4 lg:px-0">
				<Skeleton className="h-3.5 w-24 rounded" />
			</div>
			<div className="divide-y divide-border">
				{row('w-32', 'w-20')}
				{row('w-44', 'w-24')}
				{row('w-28', 'w-16')}
			</div>
		</div>
	);
}

function FilterSummaryChip({
	icon: Icon,
	label,
	onClick,
}: {
	icon: typeof Calendar;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex h-[36px] max-w-[170px] shrink-0 items-center gap-1.5 rounded-[11px] border border-accent/30 bg-accent/10 px-3 text-[12.5px] font-semibold text-accent"
		>
			<Icon className="size-[13px] shrink-0" strokeWidth={2} aria-hidden="true" />
			<span className="truncate">{label}</span>
		</button>
	);
}

export default function TransactionsPage() {
	const [month, setMonth] = useState(currentYM);
	const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month');
	const [customRange, setCustomRange] = useState<DateRange>(thisMonthRange);
	const [customFrom, setCustomFrom] = useState(thisMonthRange().from);
	const [customTo, setCustomTo] = useState(thisMonthRange().to);

	const [accountId, setAccountId] = useState('');
	const [categoryId, setCategoryId] = useState('');
	const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

	const [filterOpen, setFilterOpen] = useState(false);
	const [addOpen, setAddOpen] = useState(false);
	const [editTx, setEditTx] = useState<Transaction | null>(null);

	const { from, to } = getRangeForPreset(periodPreset, customRange);

	const { transactions, isLoading, error, mutate } = useTransactions({
		from,
		to,
		limit: 500,
	});
	const { categories } = useCategories();
	const { accounts } = useAccounts();
	const { trigger: createTx, isMutating: creating } = useCreateTransaction();
	const { trigger: updateTx, isMutating: updating } = useUpdateTransaction();
	const { trigger: deleteTx, isMutating: deleting } = useDeleteTransaction();

	// Base = period + account + category filters (excludes type)
	const base = useMemo(
		() =>
			transactions.filter((tx) => {
				if (accountId && tx.account_id !== accountId) return false;
				if (categoryId && tx.category_id !== categoryId) return false;
				return true;
			}),
		[transactions, accountId, categoryId],
	);

	// Fully filtered (includes type)
	const filtered = useMemo(() => {
		if (typeFilter === 'all') return base;
		if (typeFilter === 'income')
			return base.filter((t) => t.type === 'income' || t.type === 'refund');
		if (typeFilter === 'expense')
			return base.filter((t) => t.type === 'expense');
		return base;
	}, [base, typeFilter]);

	// Summary (always from base, not type-filtered)
	const summary = useMemo(
		() => ({
			totalIncome: base
				.filter((t) => t.type === 'income' || t.type === 'refund')
				.reduce((s, t) => s + parseInt(t.amount, 10), 0),
			incomeCount: base.filter(
				(t) => t.type === 'income' || t.type === 'refund',
			).length,
			totalExpense: base
				.filter((t) => t.type === 'expense')
				.reduce((s, t) => s + parseInt(t.amount, 10), 0),
			expenseCount: base.filter((t) => t.type === 'expense').length,
		}),
		[base],
	);

	// Counts per tab
	const tabCounts = useMemo(
		() => ({
			all: base.length,
			income: base.filter((t) => t.type === 'income' || t.type === 'refund')
				.length,
			expense: base.filter((t) => t.type === 'expense').length,
		}),
		[base],
	);

	const grouped = groupByDate(filtered);
	const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

	const selectedAccount = accounts.find((a) => a.id === accountId);
	const selectedCategory = categories.find((c) => c.id === categoryId);
	const parentCats = categories.filter((c) => !c.parent_id);
	const childCats = (pid: string) =>
		categories.filter((c) => c.parent_id === pid);

	const hasFilters = typeFilter !== 'all' || accountId || categoryId;

	// Filters that live inside the Filter sheet (period/range/account/category).
	const activeFilterCount =
		(periodPreset !== 'this_month' ? 1 : 0) +
		(accountId ? 1 : 0) +
		(categoryId ? 1 : 0);

	function resetFilters() {
		setPeriodPreset('this_month');
		setAccountId('');
		setCategoryId('');
	}

	async function handleCreate(data: CreateTransactionInput) {
		const res = await createTx(data);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Tersimpan.');
		setAddOpen(false);
		mutate();
	}

	async function handleUpdate(data: CreateTransactionInput) {
		if (!editTx) return;
		const res = await updateTx({ id: editTx.id, data });
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Diperbarui.');
		setEditTx(null);
		mutate();
	}

	async function handleDelete() {
		if (!editTx) return;
		const res = await deleteTx(editTx.id);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Dihapus.');
		setEditTx(null);
		mutate();
	}

	function applyPreset(preset: PeriodPreset) {
		setPeriodPreset(preset);
	}

	function applyCustomRange() {
		setPeriodPreset('custom');
		setCustomRange({ from: customFrom, to: customTo });
	}

	function handleMonthChange(ym: string) {
		setMonth(ym);
		const [y, m] = ym.split('-').map(Number);
		const { from: mFrom, to: mTo } = getMonthRange(y, m);
		setPeriodPreset('custom');
		setCustomRange({ from: mFrom, to: mTo });
		setCustomFrom(mFrom);
		setCustomTo(mTo);
	}

	// ── Shared type tabs ─────────────────────────────────────────────────────────

	const typeTabs = (
		<div className="flex gap-1 rounded-[14px] border border-border bg-surface p-1 lg:w-fit lg:rounded-xl">
			{TYPE_TABS.map((tab) => (
				<button
					key={tab.id}
					type="button"
					onClick={() => setTypeFilter(tab.id)}
					className={cn(
						'flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[10px] px-2 py-[7px] text-[12px] font-semibold transition-colors lg:gap-1.5 lg:rounded-lg lg:px-4',
						typeFilter === tab.id
							? 'bg-accent text-accent-foreground'
							: 'text-foreground hover:bg-muted',
					)}
				>
					<span className="truncate">{tab.label}</span>
					{!isLoading && (
						<span
							className={cn(
								'shrink-0 rounded-full px-1.5 text-[10px] font-bold tabular-nums',
								typeFilter === tab.id
									? 'bg-black/10 text-accent-foreground dark:bg-black/20'
									: 'bg-muted-foreground/15 text-muted-foreground',
							)}
						>
							{tabCounts[tab.id]}
						</span>
					)}
				</button>
			))}
		</div>
	);

	return (
		<>
			<PageHeader
				variant="sub"
				title="Transaksi"
				subtitle="If we want rich, we need to spend rich (Track and Save!)."
				backHref="/finance/dashboard"
				crumbs={[
					{ href: '/finance/dashboard', label: 'Keuangan' },
					{ href: '/finance/transactions', label: 'Transaksi' },
				]}
				monthPicker={
					<MonthPicker value={month} onChange={handleMonthChange} fullWidth />
				}
				action={
					/* desktop only: month picker + full add button (mobile adds via the FAB) */
					<div className="hidden items-center gap-2 lg:flex">
						<MonthPicker value={month} onChange={handleMonthChange} />
						<Button variant="accent" onClick={() => setAddOpen(true)}>
							<Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
							Tambah transaksi
						</Button>
					</div>
				}
			/>
			<PageContainer bleed>
			{/* Filter — single button + active-filter summary chips */}
			<div className="flex items-center gap-2 overflow-x-auto px-5 pb-3 pt-3 lg:px-0 lg:pt-0 lg:pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				<button
					type="button"
					onClick={() => setFilterOpen(true)}
					className={cn(
						'inline-flex h-[36px] shrink-0 items-center gap-2 rounded-[11px] border px-3.5 text-[13px] font-semibold transition-colors',
						activeFilterCount > 0
							? 'border-accent bg-accent text-accent-foreground'
							: 'border-border bg-surface text-foreground hover:bg-muted',
					)}
				>
					<Filter className="size-4" strokeWidth={2} aria-hidden="true" />
					Filter
					{activeFilterCount > 0 && (
						<span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-black/15 px-1.5 text-[11px] font-bold tabular-nums dark:bg-black/25">
							{activeFilterCount}
						</span>
					)}
				</button>

				{/* Read-only summary of what's active (tap any to open the sheet) */}
				{periodPreset !== 'this_month' && (
					<FilterSummaryChip
						icon={Calendar}
						label={
							periodPreset === 'custom'
								? `${customRange.from} – ${customRange.to}`
								: PRESET_LABELS[periodPreset]
						}
						onClick={() => setFilterOpen(true)}
					/>
				)}
				{selectedAccount && (
					<FilterSummaryChip
						icon={Wallet}
						label={selectedAccount.name}
						onClick={() => setFilterOpen(true)}
					/>
				)}
				{selectedCategory && (
					<FilterSummaryChip
						icon={CalendarDays}
						label={selectedCategory.name}
						onClick={() => setFilterOpen(true)}
					/>
				)}
				{activeFilterCount > 0 && (
					<button
						type="button"
						onClick={resetFilters}
						className="inline-flex h-[36px] shrink-0 items-center text-[12.5px] font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
					>
						Reset
					</button>
				)}
			</div>

			{/* ══════════════════════════════════════════════════
          SUMMARY CARDS — mobile only
      ══════════════════════════════════════════════════ */}
			{isLoading && (
				<div className="grid grid-cols-2 gap-2.5 px-5 pb-3.5 lg:hidden">
					<Skeleton className="h-[78px] rounded-[18px]" />
					<Skeleton className="h-[78px] rounded-[18px]" />
				</div>
			)}
			{!isLoading && !error && (
				<div className="grid grid-cols-2 gap-2.5 px-5 pb-3.5 lg:hidden">
					<div className="rounded-[18px] border border-border bg-surface p-3.5">
						<div className="flex items-center gap-1.5">
							<div className="flex size-[22px] items-center justify-center rounded-[7px] bg-success-soft">
								<TrendingUp
									className="size-3 text-success"
									strokeWidth={2}
									aria-hidden="true"
								/>
							</div>
							<span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Pemasukan
							</span>
						</div>
						<p
							className="mt-2 truncate text-[19px] font-bold leading-tight tracking-tight text-success tabular-nums"
							title={`Rp ${idrFmt(summary.totalIncome)}`}
						>
							{formatMoneyCompact(summary.totalIncome)}
						</p>
						<p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
							{summary.incomeCount} transaksi
						</p>
					</div>

					<div className="rounded-[18px] border border-border bg-surface p-3.5">
						<div className="flex items-center gap-1.5">
							<div className="flex size-[22px] items-center justify-center rounded-[7px] bg-danger-soft">
								<TrendingDown
									className="size-3 text-danger"
									strokeWidth={2}
									aria-hidden="true"
								/>
							</div>
							<span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Pengeluaran
							</span>
						</div>
						<p
							className="mt-2 truncate text-[19px] font-bold leading-tight tracking-tight text-danger tabular-nums"
							title={`Rp ${idrFmt(summary.totalExpense)}`}
						>
							{formatMoneyCompact(summary.totalExpense)}
						</p>
						<p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
							{summary.expenseCount} transaksi
						</p>
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════════
          KPI STRIP — desktop only
      ══════════════════════════════════════════════════ */}
			{isLoading && (
				<div className="mb-5 hidden gap-4 lg:grid lg:grid-cols-2">
					<Skeleton className="h-[88px] rounded-[18px]" />
					<Skeleton className="h-[88px] rounded-[18px]" />
				</div>
			)}
			{!isLoading && !error && (
				<div className="mb-5 hidden grid-cols-2 gap-4 lg:grid">
					<div className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-5">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-success-soft">
							<TrendingUp
								className="size-5 text-success"
								strokeWidth={2}
								aria-hidden="true"
							/>
						</div>
						<div>
							<p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
								Total Pemasukan
							</p>
							<p className="mt-1 text-[28px] font-bold tracking-tight text-success tabular-nums">
								Rp {idrFmt(summary.totalIncome)}
							</p>
							<p className="text-[12px] font-medium text-muted-foreground">
								{summary.incomeCount} transaksi
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4 rounded-[18px] border border-border bg-surface p-5">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-danger-soft">
							<TrendingDown
								className="size-5 text-danger"
								strokeWidth={2}
								aria-hidden="true"
							/>
						</div>
						<div>
							<p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
								Total Pengeluaran
							</p>
							<p className="mt-1 text-[28px] font-bold tracking-tight text-danger tabular-nums">
								Rp {idrFmt(summary.totalExpense)}
							</p>
							<p className="text-[12px] font-medium text-muted-foreground">
								{summary.expenseCount} transaksi
							</p>
						</div>
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════════
          TYPE FILTER TABS
      ══════════════════════════════════════════════════ */}
			<div className="px-5 pb-4 lg:px-0 lg:pb-4">{typeTabs}</div>

			{/* ══════════════════════════════════════════════════
          LOADING / ERROR / EMPTY
      ══════════════════════════════════════════════════ */}
			{isLoading && <TxListSkeleton />}

			{error && <ErrorState message={error} onRetry={() => mutate()} />}

			{!isLoading && !error && filtered.length === 0 && (
				<EmptyState
					icon={ArrowLeftRight}
					title={hasFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
					description={
						hasFilters
							? 'Coba ubah filter atau periode yang dipilih.'
							: 'Tambahkan yang pertama dengan tombol di atas.'
					}
					action={
						!hasFilters ? (
							<Button variant="accent" onClick={() => setAddOpen(true)}>
								<Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
								Tambah Transaksi
							</Button>
						) : undefined
					}
				/>
			)}

			{/* ══════════════════════════════════════════════════
          MOBILE — day-grouped card list
      ══════════════════════════════════════════════════ */}
			{!isLoading && !error && sortedDates.length > 0 && (
				<div className="space-y-4 px-5 pb-28 lg:hidden">
					{sortedDates.map((date) => {
						const items = grouped[date];
						const net = dayNet(items);
						return (
							<div key={date}>
								<div className="mb-2 flex items-center justify-between px-1">
									<p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{format(new Date(date), 'EEEE, d MMMM', { locale: id })}
									</p>
									<p
										className={cn(
											'text-[11px] font-bold tabular-nums',
											net >= 0 ? 'text-success' : 'text-danger',
										)}
									>
										{net >= 0 ? '+' : '−'} Rp {idrFmt(Math.abs(net))}
									</p>
								</div>
								<div className="overflow-hidden rounded-[18px] border border-border bg-surface">
									{items.map((tx, i) => (
										<div
											key={tx.id}
											className={cn(i > 0 && 'border-t border-border')}
										>
											<TransactionItem
												transaction={tx}
												categories={categories}
												accounts={accounts}
												onClick={() => setEditTx(tx)}
											/>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* ══════════════════════════════════════════════════
          DESKTOP — table
      ══════════════════════════════════════════════════ */}
			{!isLoading && !error && sortedDates.length > 0 && (
				<div className="hidden overflow-hidden rounded-[20px] border border-border bg-surface lg:block">
					{/* Table header */}
					<div className="grid grid-cols-[1fr_160px_140px_90px_160px_72px] border-b border-border bg-muted/40 px-6 py-3.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
						<div>Deskripsi</div>
						<div>Kategori</div>
						<div>Akun</div>
						<div className="text-center">Tipe</div>
						<div className="text-right">Jumlah</div>
						<div className="text-right">Waktu</div>
					</div>

					{sortedDates.map((date, gi) => {
						const items = grouped[date];
						const net = dayNet(items);
						return (
							<div key={date}>
								{/* Day separator */}
								<div
									className={cn(
										'flex items-center justify-between bg-muted/20 px-6 py-3',
										gi > 0 && 'border-t border-border',
									)}
								>
									<p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
										{format(new Date(date), 'EEEE, d MMMM yyyy', {
											locale: id,
										})}
									</p>
									<p
										className={cn(
											'text-[11.5px] font-bold tabular-nums',
											net >= 0 ? 'text-success' : 'text-danger',
										)}
									>
										{net >= 0 ? '+' : '−'} Rp {idrFmt(Math.abs(net))}
									</p>
								</div>

								{/* Transaction rows */}
								{items.map((tx) => {
									const cat = categories.find((c) => c.id === tx.category_id);
									const acc = accounts.find((a) => a.id === tx.account_id);
									const pill = TYPE_PILL[tx.type] ?? {
										label: tx.type,
										cls: 'bg-muted text-muted-foreground',
									};
									const txTime = tx.created_at
										? format(new Date(tx.created_at), 'HH:mm')
										: '—';
									const catColor = cat?.color;
									const iconBg = catColor ? `${catColor}1f` : undefined;

									return (
										<div
											key={tx.id}
											role="button"
											tabIndex={0}
											onClick={() => setEditTx(tx)}
											onKeyDown={(e) => e.key === 'Enter' && setEditTx(tx)}
											className="grid cursor-pointer grid-cols-[1fr_160px_140px_90px_160px_72px] items-center border-t border-border px-6 py-3.5 transition-colors hover:bg-muted/40"
										>
											{/* Description */}
											<div className="flex min-w-0 items-center gap-3">
												<div
													className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-muted"
													style={
														iconBg ? { backgroundColor: iconBg } : undefined
													}
													aria-hidden="true"
												>
													<div
														className="size-2.5 rounded-full bg-muted-foreground"
														style={
															catColor
																? { backgroundColor: catColor }
																: undefined
														}
													/>
												</div>
												<p className="truncate text-[13.5px] font-semibold">
													{tx.description}
												</p>
											</div>

											{/* Category */}
											<p className="text-[12.5px] font-medium text-muted-foreground">
												{cat?.name ?? '—'}
											</p>

											{/* Account */}
											<p className="text-[12.5px] font-medium text-muted-foreground">
												{acc?.name ?? '—'}
											</p>

											{/* Type pill */}
											<div className="text-center">
												<span
													className={cn(
														'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold',
														pill.cls,
													)}
												>
													{pill.label}
												</span>
											</div>

											{/* Amount */}
											<div className="text-right">
												<MoneyDisplay
													amount={parseInt(tx.amount, 10)}
													type={tx.type}
													className="text-[14px] font-bold"
												/>
											</div>

											{/* Time */}
											<p className="text-right text-[11.5px] font-medium text-muted-foreground tabular-nums">
												{txTime}
											</p>
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			)}

			{/* ══════════════════════════════════════════════════
          DIALOGS
      ══════════════════════════════════════════════════ */}

			{/* Filter sheet — period / range / account / category in one place */}
			<Sheet open={filterOpen} onOpenChange={setFilterOpen}>
				<SheetContent
					side="bottom"
					className="max-h-[88vh] gap-0 rounded-t-2xl p-0 lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:max-h-none lg:w-[420px] lg:rounded-none"
				>
					<SheetHeader className="border-b border-border px-5 pb-4 pt-5">
						<SheetTitle className="text-[17px]">Filter Transaksi</SheetTitle>
					</SheetHeader>

					<div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
						{/* Periode */}
						<section className="space-y-2.5">
							<p className="text-eyebrow text-muted-foreground">Periode</p>
							<div className="grid grid-cols-2 gap-2">
								{(
									['this_month', 'last_month', '3_months', '6_months'] as PeriodPreset[]
								).map((p) => (
									<button
										key={p}
										type="button"
										onClick={() => applyPreset(p)}
										className={cn(
											'rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition-colors',
											periodPreset === p
												? 'border-accent bg-accent/10 text-accent'
												: 'border-border bg-surface text-foreground hover:bg-muted',
										)}
									>
										{PRESET_LABELS[p]}
									</button>
								))}
							</div>
							{/* Custom range */}
							<div
								className={cn(
									'rounded-xl border p-3',
									periodPreset === 'custom'
										? 'border-accent bg-accent/5'
										: 'border-border',
								)}
							>
								<div className="grid grid-cols-2 gap-3">
									<div className="grid gap-1.5">
										<Label htmlFor="range-from" className="text-[11px] text-muted-foreground">Dari</Label>
										<Input id="range-from" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
									</div>
									<div className="grid gap-1.5">
										<Label htmlFor="range-to" className="text-[11px] text-muted-foreground">Sampai</Label>
										<Input id="range-to" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
									</div>
								</div>
								<Button variant="outline" size="sm" className="mt-3 w-full" onClick={applyCustomRange}>
									Terapkan rentang custom
								</Button>
							</div>
						</section>

						{/* Akun */}
						<section className="space-y-2">
							<p className="text-eyebrow text-muted-foreground">Akun</p>
							<button
								type="button"
								onClick={() => setAccountId('')}
								className={cn(
									'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors hover:bg-muted',
									!accountId && 'bg-accent/10 text-accent',
								)}
							>
								Semua akun
							</button>
							{accounts.map((a) => (
								<button
									key={a.id}
									type="button"
									onClick={() => setAccountId(a.id)}
									className={cn(
										'flex w-full items-center rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted',
										accountId === a.id && 'bg-accent/10',
									)}
								>
									<AccountOption account={a} />
								</button>
							))}
						</section>

						{/* Kategori */}
						<section className="space-y-2">
							<p className="text-eyebrow text-muted-foreground">Kategori</p>
							<button
								type="button"
								onClick={() => setCategoryId('')}
								className={cn(
									'flex w-full items-center rounded-lg px-3 py-2.5 text-left text-[13.5px] font-semibold transition-colors hover:bg-muted',
									!categoryId && 'bg-accent/10 text-accent',
								)}
							>
								Semua kategori
							</button>
							{parentCats.map((parent) => {
								const children = childCats(parent.id);
								const rows = children.length > 0 ? children : [parent];
								return (
									<div key={parent.id} className="pt-1">
										{children.length > 0 && (
											<p className="mb-0.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
												{parent.name}
											</p>
										)}
										{rows.map((cat) => (
											<button
												key={cat.id}
												type="button"
												onClick={() => setCategoryId(cat.id)}
												className={cn(
													'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors hover:bg-muted',
													categoryId === cat.id && 'bg-accent/10 font-semibold text-accent',
												)}
											>
												<span
													className="size-2 shrink-0 rounded-full"
													style={{ backgroundColor: cat.color || '#64748b' }}
												/>
												<span className="truncate">{cat.name}</span>
											</button>
										))}
									</div>
								);
							})}
						</section>
					</div>

					<SheetFooter className="flex-row gap-3 border-t border-border px-5 py-4">
						<Button
							variant="outline"
							className="flex-1"
							onClick={resetFilters}
							disabled={activeFilterCount === 0}
						>
							Reset
						</Button>
						<Button variant="accent" className="flex-1" onClick={() => setFilterOpen(false)}>
							Lihat {filtered.length} transaksi
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			{/* Add */}
			<Dialog open={addOpen} onOpenChange={setAddOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Transaksi</DialogTitle>
					</DialogHeader>
					<TransactionForm
						onSubmit={handleCreate}
						onCancel={() => setAddOpen(false)}
						loading={creating}
					/>
				</DialogContent>
			</Dialog>

			{/* Edit */}
			<Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Transaksi</DialogTitle>
					</DialogHeader>
					{editTx && (
						<>
							<TransactionForm
								defaultValues={editTx}
								onSubmit={handleUpdate}
								onCancel={() => setEditTx(null)}
								loading={updating}
							/>
							<Button
								variant="destructive"
								className="mt-2 w-full"
								onClick={handleDelete}
								disabled={deleting}
								aria-busy={deleting}
							>
								<Trash2
									className="size-4"
									strokeWidth={2.25}
									aria-hidden="true"
								/>
								{deleting ? 'Menghapus…' : 'Hapus Transaksi'}
							</Button>
						</>
					)}
				</DialogContent>
			</Dialog>
		</PageContainer>
		</>
	);
}
