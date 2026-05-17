'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
	ArrowLeftRight,
	Briefcase,
	ExternalLink,
	FileText,
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
import { TransactionItem } from '@/components/finance/transaction-item';
import { CategoryIcon } from '@/components/finance/category-icon';
import {
	buildRegistryData,
	type RegistryItem,
} from '@/components/finance/asset-registry-shared';
import { MobileBackButton } from '@/components/nav/mobile-back-button';
import { PageContainer } from '@/components/layout/page-container';
import { useAccounts } from '@/hooks/use-accounts';
import { useAssets } from '@/hooks/use-assets';
import { useCategories } from '@/hooks/use-categories';
import { useTransactions } from '@/hooks/use-transactions';
import { cn } from '@/lib/utils';
import type { Asset, TransactionCategory } from '@/domain/types';

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
	const [detail, setDetail] = useState<RegistryItem | null>(null);

	const isLoading = accLoading || assetLoading;
	const error = accError || assetError;
	const { liquidGroups, nonLiquidGroups, totalSaldo, totalNilai, hasItems } =
		buildRegistryData(accounts, assets);

	function handleRetry() {
		mutateAccounts();
		mutateAssets();
	}

	return (
		<PageContainer bleed>
			<header className="space-y-4 px-5 py-4 lg:px-0 lg:py-0 lg:pb-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<MobileBackButton />
						<h1 className="text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
							Aset
						</h1>
						<p className="hidden text-[13px] text-muted-foreground lg:block">
							Daftar aset likuid dan non-likuid keluarga.
						</p>
					</div>
					<Button
						asChild
						variant="outline"
						className="shrink-0 rounded-pill lg:rounded-md"
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
				<div className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
					{/* Summary header */}
					<div className="bg-surface px-5 py-4 lg:border-b lg:border-border lg:bg-muted/40 lg:px-6">
						<div className="flex flex-wrap gap-6">
							<div>
								<p className="text-eyebrow text-muted-foreground">
									Total Saldo
								</p>
								<MoneyDisplay
									amount={totalSaldo}
									className="mt-1 text-2xl lg:text-[26px]"
								/>
								<p className="mt-0.5 text-[11px] text-muted-foreground">
									Aset yang dihitung ke saldo
								</p>
							</div>
							{totalNilai !== totalSaldo && (
								<div>
									<p className="text-eyebrow text-muted-foreground">
										Total Nilai
									</p>
									<MoneyDisplay
										amount={totalNilai}
										className="mt-1 text-2xl lg:text-[26px]"
									/>
									<p className="mt-0.5 text-[11px] text-muted-foreground">
										Semua aset
									</p>
								</div>
							)}
						</div>
					</div>

					{Object.keys(liquidGroups).length > 0 && (
						<AsetGroupSection
							title="Aset Likuid"
							subTitle="Ketuk untuk melihat detail dan transaksi."
							groups={liquidGroups}
							onSelect={setDetail}
						/>
					)}

					{Object.keys(nonLiquidGroups).length > 0 && (
						<AsetGroupSection
							title="Aset Non-Likuid"
							subTitle="Ketuk untuk melihat detail nilai aset."
							groups={nonLiquidGroups}
							onSelect={setDetail}
						/>
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

function AsetGroupSection({
	title,
	subTitle,
	groups,
	onSelect,
}: {
	title: string;
	subTitle?: string;
	groups: Record<string, RegistryItem[]>;
	onSelect: (item: RegistryItem) => void;
}) {
	return (
		<div className="lg:border-t lg:border-border">
			<div className="px-5 pb-1.5 pt-3 lg:bg-muted/20 lg:py-2.5">
				<p className="text-sm font-semibold">{title}</p>
				{subTitle && (
					<p className="text-[11px] text-muted-foreground">{subTitle}</p>
				)}
			</div>
			{Object.entries(groups).map(([groupLabel, items], idx) => (
				<section
					key={groupLabel}
					className={cn(
						'mb-2 lg:mb-0',
						idx > 0 && 'lg:border-t lg:border-border/60',
					)}
				>
					<div className="px-5 pb-1 pt-2 lg:bg-muted/40 lg:py-1.5">
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
								<MoneyDisplay amount={item.value} />
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
	const linkedAccountId =
		detail.kind === 'account'
			? detail.id
			: (detail.raw as Asset).account_id || '__none__';

	const { transactions, isLoading, error } = useTransactions({
		account_id: linkedAccountId,
		limit: 5,
	});

	const asset = detail.kind === 'asset' ? (detail.raw as Asset) : null;
	const hasLinkedAccount = detail.kind === 'account' || !!asset?.account_id;

	// Build the href for "Lihat Transaksi"
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
					label={detail.kind === 'account' ? 'Saldo Saat Ini' : 'Nilai Aset'}
					value={<MoneyDisplay amount={detail.value} className="text-[22px]" />}
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

			{/* Transactions section */}
			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 className="text-sm font-semibold">Transaksi Terkait</h3>
						<p className="text-[12px] text-muted-foreground">
							{detail.kind === 'account'
								? 'Riwayat transaksi akun ini.'
								: hasLinkedAccount
									? 'Transaksi dari akun yang ditautkan.'
									: 'Aset ini belum ditautkan ke akun.'}
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
						{/* <div className="border-t border-border p-3">
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href={transactionsHref}>
                  Lihat Semua Transaksi
                  <ExternalLink className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
                </Link>
              </Button>
            </div> */}
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
