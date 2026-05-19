'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
	ArrowLeftRight,
	Briefcase,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	Eye,
	EyeOff,
	FileText,
	TrendingDown,
	TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/sections/empty-state';
import { ErrorState } from '@/components/sections/error-state';
import { ListSkeleton } from '@/components/sections/loading-state';
import { MoneyDisplay } from '@/components/finance/money-display';
import { QuantityDisplay } from '@/components/finance/quantity-display';
import { TransactionItem } from '@/components/finance/transaction-item';
import { CategoryIcon } from '@/components/finance/category-icon';
import {
	buildRegistryData,
	buildRegistryDataLegacy,
	type RegistryItem,
} from '@/components/finance/asset-registry-shared';
import {
	AssetGrowthChart,
	computeGrowthStats,
} from '@/components/finance/asset-growth-chart';
import { MobileBackButton } from '@/components/nav/mobile-back-button';
import { PageContainer } from '@/components/layout/page-container';
import { useAccounts } from '@/hooks/use-accounts';
import { useAssets } from '@/hooks/use-assets';
import { useAssetSnapshots } from '@/hooks/use-asset-snapshots';
import { useCategories } from '@/hooks/use-categories';
import { usePriceRates } from '@/hooks/use-price-rates';
import { useTransactions } from '@/hooks/use-transactions';
import { formatMoneyCompact } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { TransactionCategory } from '@/domain/types';

function monthLabel(ym: string) {
	const m = parseInt(ym.split('-')[1], 10);
	const labels = [
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
	return labels[m - 1] ?? ym;
}

export default function AsetPage() {
	const {
		accounts,
		isLoading: accLoading,
		error: accError,
		mutate: mutateAccounts,
	} = useAccounts();
	const {
		assets,
		isLoading: assetLoading,
		error: assetError,
		mutate: mutateAssets,
	} = useAssets();
	const { categories } = useCategories();
	const { snapshots } = useAssetSnapshots(6);
	const { rates } = usePriceRates();
	const [detail, setDetail] = useState<RegistryItem | null>(null);
	const [hideValues, setHideValues] = useState(false);

	const isLoading = accLoading || assetLoading;
	const error = accError || assetError;
	const {
		liquidItems,
		nonLiquidItems,
		liquidGroups,
		nonLiquidGroups,
		totalSaldo,
		totalNilai,
		hasItems,
	} = buildRegistryDataLegacy(accounts, assets, rates);

	const liquidTotal = liquidItems.reduce((s, i) => s + i.value, 0);
	const nonLiquidTotal = nonLiquidItems.reduce((s, i) => {
		if (i.satuan === 'rupiah') return s + i.value;
		if (i.idrValue != null) return s + i.idrValue;
		return s;
	}, 0);

	const { growthPct, avgMonthly, currentMonth } = computeGrowthStats(snapshots);

	function handleRetry() {
		mutateAccounts();
		mutateAssets();
	}

	// Account avatar pills (first 3 + overflow)
	const avatarAccounts = accounts.slice(0, 3);
	const avatarOverflow = Math.max(0, accounts.length - 3);

	return (
		<PageContainer bleed>
			<header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
				<div className="min-w-0">
					<MobileBackButton />
					<h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
						Aset Keluarga
					</h1>
					<p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
						Assets are not just numbers on a spreadsheet — they are one step
						towards financial freedom.
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						asChild
						type="button"
						className="hidden h-10 items-center gap-2 rounded-md bg-accent px-4 text-[13px] font-semibold text-accent-foreground transition-opacity hover:opacity-90 lg:inline-flex"
					>
						<Link href="/settings/finance-setup/assets">
							Kelola Aset
							<ExternalLink
								className="size-4"
								strokeWidth={2.25}
								aria-hidden="true"
							/>
						</Link>
					</Button>
				</div>
			</header>

			{isLoading && <ListSkeleton count={5} />}
			{error && <ErrorState message={error} onRetry={handleRetry} />}

			{!isLoading && !error && !hasItems && (
				<EmptyState
					icon={Briefcase}
					title="Belum ada aset"
					description="Tambahkan aset melalui menu Kelola Aset."
					action={
						<Button asChild variant="accent">
							<Link href="/settings/finance-setup/assets">Kelola Aset</Link>
						</Button>
					}
				/>
			)}

			{!isLoading && !error && hasItems && (
				<div className="space-y-2 lg:space-y-4">
					{/* Top section: summary cards + growth chart */}
					<div className="grid grid-cols-1 gap-2 lg:grid-cols-[420px_1fr] lg:gap-4">
						{/* Left column: two summary cards */}
						<div className="flex flex-col gap-2">
							{/* Total Saldo card */}
							<div className="rounded-xl border border-border bg-surface p-4">
								<p className="text-eyebrow text-muted-foreground">
									TOTAL SALDO
								</p>
								<MoneyDisplay amount={totalSaldo} className="mt-1 text-2xl" />
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									Saldo gabungan semua akun
								</p>
								{avatarAccounts.length > 0 && (
									<div className="mt-3 flex items-center gap-1.5">
										<div className="flex -space-x-1.5">
											{avatarAccounts.map((acc) => (
												<span
													key={acc.id}
													className="flex size-6 items-center justify-center rounded-full border-2 border-surface text-[10px] font-bold text-white"
													style={{ backgroundColor: acc.color ?? '#1e40af' }}
													title={acc.name}
												>
													{acc.name.charAt(0).toUpperCase()}
												</span>
											))}
										</div>
										{avatarOverflow > 0 && (
											<span className="text-[11px] text-muted-foreground">
												+{avatarOverflow} akun lainnya
											</span>
										)}
									</div>
								)}
							</div>

							{/* Aset Kekayaan card */}
							<div className="rounded-xl border border-border bg-surface p-4">
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-1.5">
										<p className="text-eyebrow text-muted-foreground">
											ASET KEKAYAAN
										</p>
										{growthPct !== null && (
											<Badge
												variant={growthPct >= 0 ? 'success' : 'danger'}
												className="px-1.5 py-0 text-[10px]"
											>
												{growthPct >= 0 ? '+' : ''}
												{growthPct.toFixed(1)}%
											</Badge>
										)}
									</div>
									<button
										type="button"
										onClick={() => setHideValues((v) => !v)}
										className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
										aria-label={
											hideValues ? 'Tampilkan nilai' : 'Sembunyikan nilai'
										}
									>
										{hideValues ? (
											<EyeOff className="size-4" strokeWidth={2} />
										) : (
											<Eye className="size-4" strokeWidth={2} />
										)}
									</button>
								</div>

								<div className="mt-2">
									{hideValues ? (
										<span className="text-[22px] font-bold tabular-nums tracking-tight">
											••••••
										</span>
									) : (
										<MoneyDisplay
											amount={totalNilai}
											className="text-[22px] font-bold"
										/>
									)}
									<p className="text-[11px] text-muted-foreground">
										Total kekayaan dalam rupiah
									</p>
								</div>

								<div className="mt-3 flex items-center gap-4">
									<LiquidDonut
										liquid={liquidTotal}
										nonLiquid={nonLiquidTotal}
										size={72}
									/>
									<div className="flex-1 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-1.5">
												<span className="size-2 rounded-full bg-blue-500" />
												<span className="text-[12px] text-muted-foreground">
													Likuid
												</span>
											</div>
											{hideValues ? (
												<span className="text-sm font-semibold tabular-nums">
													••••••
												</span>
											) : (
												<MoneyDisplay
													amount={liquidTotal}
													className="text-sm"
												/>
											)}
										</div>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-1.5">
												<span className="size-2 rounded-full bg-yellow-500" />
												<span className="text-[12px] text-muted-foreground">
													Non Likuid
												</span>
											</div>
											{hideValues ? (
												<span className="text-sm font-semibold tabular-nums">
													••••••
												</span>
											) : (
												<MoneyDisplay
													amount={nonLiquidTotal}
													className="text-sm"
												/>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Right column: Growth chart */}
						<div className="overflow-hidden rounded-xl border border-border bg-surface">
							<div className="flex items-start justify-between gap-3 px-4 pt-4">
								<div>
									<p className="text-eyebrow text-muted-foreground">
										PERTUMBUHAN
									</p>
									<p className="mt-0.5 text-[13px] font-medium">
										Komposisi Aset – Tren 6 Bulan
									</p>
								</div>
								<div className="flex items-center gap-3 shrink-0">
									<LegendDot color="#3b82f6" label="Likuid" />
									<LegendDot color="#eab308" label="Non Likuid" />
								</div>
							</div>

							{snapshots.length === 0 ? (
								<div className="flex h-40 items-center justify-center">
									<p className="text-[12px] text-muted-foreground">
										Belum ada data — snapshot pertama akan dibuat otomatis bulan
										depan.
									</p>
								</div>
							) : (
								<>
									<AssetGrowthChart
										snapshots={snapshots}
										height={260}
										className="mt-2"
									/>
									<div className="flex gap-6 border-t border-border px-4 py-3">
										<div>
											<p className="text-eyebrow text-muted-foreground">
												PERTUMBUHAN{' '}
												{currentMonth
													? monthLabel(currentMonth).toUpperCase()
													: ''}
											</p>
											{growthPct !== null ? (
												<div className="mt-0.5 flex items-center gap-1">
													{growthPct >= 0 ? (
														<TrendingUp className="size-3.5 text-success" />
													) : (
														<TrendingDown className="size-3.5 text-destructive" />
													)}
													<span
														className={cn(
															'text-sm font-semibold tabular-nums',
															growthPct >= 0
																? 'text-success'
																: 'text-destructive',
														)}
													>
														{growthPct >= 0 ? '+' : ''}
														{growthPct.toFixed(1)}%
													</span>
												</div>
											) : (
												<p className="mt-0.5 text-[12px] text-muted-foreground">
													—
												</p>
											)}
										</div>
										<div>
											<p className="text-eyebrow text-muted-foreground">
												RATA-RATA 6 BLN
											</p>
											{avgMonthly !== null ? (
												<p className="mt-0.5 text-sm font-semibold tabular-nums">
													{avgMonthly >= 0 ? '+' : ''}
													{formatMoneyCompact(Math.abs(avgMonthly))} / bln
												</p>
											) : (
												<p className="mt-0.5 text-[12px] text-muted-foreground">
													—
												</p>
											)}
										</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Asset list sections */}
					{Object.keys(liquidGroups).length > 0 && (
						<div className="overflow-hidden rounded-xl border border-border bg-surface">
							<AsetGroupSection
								title="Aset Likuid"
								subTitle="Ketuk untuk melihat detail dan transaksi."
								total={liquidTotal}
								dotColor="#3b82f6"
								groups={liquidGroups}
								onSelect={setDetail}
							/>
						</div>
					)}

					{Object.keys(nonLiquidGroups).length > 0 && (
						<div className="overflow-hidden rounded-xl border border-border bg-surface">
							<AsetGroupSection
								title="Aset Non-Likuid"
								subTitle="Ketuk untuk melihat detail nilai aset."
								total={nonLiquidTotal}
								dotColor="#eab308"
								groups={nonLiquidGroups}
								onSelect={setDetail}
							/>
						</div>
					)}
				</div>
			)}

			<Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
				<DialogContent className="sm:max-w-2xl">
					{detail && (
						<AsetDetailDialog detail={detail} categories={categories} />
					)}
				</DialogContent>
			</Dialog>
		</PageContainer>
	);
}

function LiquidDonut({
	liquid,
	nonLiquid,
	size = 72,
}: {
	liquid: number;
	nonLiquid: number;
	size?: number;
}) {
	const total = liquid + nonLiquid || 1;
	const r = 28;
	const stroke = 10;
	const c = 2 * Math.PI * r;
	const liquidArc = (liquid / total) * c;
	const cx = size / 2;
	const cy = size / 2;
	const liquidPct = Math.round((liquid / total) * 100);

	return (
		<div className="relative shrink-0" style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				style={{ transform: 'rotate(-90deg)' }}
			>
				{/* Track */}
				<circle
					cx={cx}
					cy={cy}
					r={r}
					fill="none"
					stroke="#eab308"
					strokeWidth={stroke}
					opacity="0.25"
				/>
				{/* Non-liquid background arc */}
				<circle
					cx={cx}
					cy={cy}
					r={r}
					fill="none"
					stroke="#eab308"
					strokeWidth={stroke}
					strokeDasharray={`${c} ${c}`}
					strokeDashoffset={0}
					strokeLinecap="butt"
				/>
				{/* Liquid arc on top */}
				<circle
					cx={cx}
					cy={cy}
					r={r}
					fill="none"
					stroke="#3b82f6"
					strokeWidth={stroke}
					strokeDasharray={`${liquidArc} ${c - liquidArc}`}
					strokeLinecap="butt"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className="text-[13px] font-bold tabular-nums leading-none">
					{liquidPct}%
				</span>
				<span className="text-[9px] text-muted-foreground leading-none mt-0.5">
					Likuid
				</span>
			</div>
		</div>
	);
}

function LegendDot({ color, label }: { color: string; label: string }) {
	return (
		<div className="flex items-center gap-1">
			<span
				className="size-2 rounded-full"
				style={{ backgroundColor: color }}
			/>
			<span className="text-[11px] text-muted-foreground">{label}</span>
		</div>
	);
}

function AsetGroupSection({
	title,
	subTitle,
	total,
	dotColor,
	groups,
	onSelect,
	defaultExpanded = false,
}: {
	title: string;
	subTitle?: string;
	total?: number;
	dotColor?: string;
	groups: Record<string, RegistryItem[]>;
	onSelect: (item: RegistryItem) => void;
	defaultExpanded?: boolean;
}) {
	const [expanded, setExpanded] = useState(defaultExpanded);

	return (
		<div>
			<button
				type="button"
				className="flex w-full items-center justify-between gap-3 px-5 pb-1.5 pt-3 text-left bg-muted/20 py-2.5"
				onClick={() => setExpanded((e) => !e)}
			>
				<div className="flex items-center gap-2.5 min-w-0">
					{dotColor && (
						<span
							className="size-2.5 shrink-0 rounded-full"
							style={{ backgroundColor: dotColor }}
						/>
					)}
					<div>
						<p className="text-sm font-semibold">{title}</p>
						{subTitle && (
							<p className="text-[11px] text-muted-foreground">{subTitle}</p>
						)}
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{total !== undefined && (
						<MoneyDisplay
							amount={total}
							className="text-sm font-semibold tabular-nums"
						/>
					)}
					{expanded ? (
						<ChevronDown className="size-4 text-muted-foreground" />
					) : (
						<ChevronRight className="size-4 text-muted-foreground" />
					)}
				</div>
			</button>

			{expanded &&
				Object.entries(groups).map(([groupLabel, items], idx) => (
					<section
						key={groupLabel}
						className={cn(idx > 0 && 'border-t border-border/60')}
					>
						<div className="px-5 pb-1 pt-2 bg-muted/40 py-1.5">
							<p className="text-eyebrow text-muted-foreground">{groupLabel}</p>
						</div>
						<div className="divide-y divide-border bg-surface">
							{items.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => onSelect(item)}
									className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
								>
									<span
										className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
										style={{ backgroundColor: item.color }}
									>
										<CategoryIcon icon={item.icon} className="size-5" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-1.5">
											<p className="truncate font-medium">{item.name}</p>
											{!item.includeInSaldo && (
												<Badge
													variant="secondary"
													className="shrink-0 px-1.5 py-0 text-[10px]"
												>
													Dikecualikan
												</Badge>
											)}
										</div>
										<p className="truncate text-xs text-muted-foreground">
											{item.subLabel || item.typeLabel}
										</p>
									</div>
									<QuantityDisplay
										value={item.value}
										satuan={item.satuan}
										idrValue={item.idrValue}
									/>
								</button>
							))}
						</div>
					</section>
				))}
		</div>
	);
}

function AsetDetailDialog({
	detail,
	categories,
}: {
	detail: RegistryItem;
	categories: TransactionCategory[];
}) {
	const linkedAccountId = detail.kind === 'liquid' ? detail.id : '__none__';

	const { transactions, isLoading, error } = useTransactions({
		account_id: linkedAccountId,
		limit: 5,
	});

	const hasLinkedAccount = detail.kind === 'liquid';

	const transactionsHref = `/finance/transactions?account_id=${linkedAccountId}`;

	return (
		<div className="space-y-5">
			<DialogHeader>
				<div className="flex items-center gap-3">
					<span
						className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white"
						style={{ backgroundColor: detail.color }}
					>
						<CategoryIcon icon={detail.icon} className="size-6" />
					</span>
					<div>
						<DialogTitle className="text-left">{detail.name}</DialogTitle>
						<p className="text-sm text-muted-foreground">{detail.typeLabel}</p>
					</div>
				</div>
			</DialogHeader>

			<div className="grid grid-cols-2 gap-3">
				<InfoCard
					label={
						detail.kind === 'liquid'
							? 'Saldo Saat Ini'
							: detail.satuan === 'rupiah'
								? 'Nilai Aset'
								: 'Jumlah'
					}
					value={
						<QuantityDisplay
							value={detail.value}
							satuan={detail.satuan}
							idrValue={detail.idrValue}
							className="text-[22px]"
						/>
					}
				/>
				<InfoCard
					label="Hitung ke Saldo"
					value={
						<Badge variant={detail.includeInSaldo ? 'success' : 'secondary'}>
							{detail.includeInSaldo ? 'Ya' : 'Tidak'}
						</Badge>
					}
				/>
			</div>

			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 className="text-sm font-semibold">Transaksi Terkait</h3>
						<p className="text-[12px] text-muted-foreground">
							{detail.kind === 'liquid'
								? 'Riwayat transaksi akun ini.'
								: 'Aset non-likuid tidak memiliki riwayat transaksi.'}
						</p>
					</div>
					{hasLinkedAccount && (
						<Button asChild variant="outline" size="sm" className="shrink-0">
							<Link href={transactionsHref}>
								Lihat Transaksi
								<ExternalLink
									className="size-3.5"
									strokeWidth={2.25}
									aria-hidden="true"
								/>
							</Link>
						</Button>
					)}
				</div>

				{!hasLinkedAccount ? (
					<EmptyState
						icon={FileText}
						title="Belum ada transaksi"
						description="Aset non-likuid yang belum ditautkan ke akun tidak memiliki riwayat transaksi."
						className="rounded-xl border border-border bg-surface py-8"
					/>
				) : isLoading ? (
					<ListSkeleton count={3} />
				) : error ? (
					<ErrorState message={error} />
				) : transactions.length === 0 ? (
					<EmptyState
						icon={ArrowLeftRight}
						title="Belum ada transaksi"
						description="Belum ada transaksi untuk aset ini."
						className="rounded-xl border border-border bg-surface py-8"
					/>
				) : (
					<div className="overflow-hidden rounded-xl border border-border bg-surface">
						<div className="divide-y divide-border">
							{transactions.map((tx) => (
								<TransactionItem
									key={tx.id}
									transaction={tx}
									categories={categories}
								/>
							))}
						</div>
					</div>
				)}
			</section>
		</div>
	);
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="rounded-xl border border-border bg-surface p-4">
			<p className="text-eyebrow text-muted-foreground">{label}</p>
			<div className="mt-2">{value}</div>
		</div>
	);
}
