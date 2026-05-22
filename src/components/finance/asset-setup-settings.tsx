'use client';

import { useState } from 'react';
import { Plus, ArrowLeftRight, Trash2, Wallet, Briefcase, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/sections/empty-state';
import { ErrorState } from '@/components/sections/error-state';
import { MoneyDisplay } from '@/components/finance/money-display';
import { QuantityDisplay } from '@/components/finance/quantity-display';
import {
	AssetForm,
	type UnifiedAssetResult,
} from '@/components/finance/asset-form';
import { TransferForm } from '@/components/finance/transfer-form'
import { MoveBalanceForm } from '@/components/finance/move-balance-form';
import { CategoryIcon } from '@/components/finance/category-icon';
import {
	useAccounts,
	useCreateAccount,
	useUpdateAccount,
	useDeleteAccount,
	useCreateTransfer,
	useMoveBalance,
} from '@/hooks/use-accounts';
import {
	useAssets,
	useCreateAsset,
	useUpdateAsset,
	useDeleteAsset,
} from '@/hooks/use-assets';
import { usePriceRates } from '@/hooks/use-price-rates';
import { useFavoriteAccountIds } from '@/hooks/use-favorite-account-ids';
import { convertAssetToIdr } from '@/domain/rates';
import {
	ASSET_TYPE_LABELS,
	ASSET_TYPE_ICONS,
	ASSET_TYPE_COLORS,
	ASSET_TYPE_SATUAN,
} from '@/domain/constants';
import { cn } from '@/lib/utils';
import type {
	Asset,
	CreateTransferInput,
	PriceRate,
} from '@/domain/types';

type ActiveTab = 'liquid' | 'nonliquid';

type EditTarget = { kind: 'account' | 'asset'; item: Asset };

export function AssetSetupSettings() {
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
	const { trigger: createAcc, isMutating: creatingAcc } = useCreateAccount();
	const { trigger: updateAcc, isMutating: updatingAcc } = useUpdateAccount();
	const { trigger: deleteAcc, isMutating: deletingAcc } = useDeleteAccount();
	const { trigger: transfer, isMutating: transferring } = useCreateTransfer();
	const { trigger: moveBalance, isMutating: movingBalance } = useMoveBalance();
	const { trigger: createAsset, isMutating: creatingAsset } = useCreateAsset();
	const { trigger: updateAsset, isMutating: updatingAsset } = useUpdateAsset();
	const { trigger: deleteAsset, isMutating: deletingAsset } = useDeleteAsset();
	const { rates } = usePriceRates();

	const [activeTab, setActiveTab] = useState<ActiveTab>('liquid');
	const [addOpen, setAddOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
	const [transferOpen, setTransferOpen] = useState(false);
	const [moveOpen, setMoveOpen] = useState(false);

	const isLoading = accLoading || assetLoading;
	const error = accError || assetError;

	const liquidAccounts = accounts;
	const nonLiquidAssets = assets;

	// Group liquid accounts by type
	const liquidGroups: Record<string, Asset[]> = {};
	for (const acc of liquidAccounts) {
		const label = ASSET_TYPE_LABELS[acc.type] ?? acc.type;
		(liquidGroups[label] = liquidGroups[label] || []).push(acc);
	}

	// Group non-liquid assets by type
	const nonLiquidGroups: Record<string, Asset[]> = {};
	for (const asset of nonLiquidAssets) {
		const label = ASSET_TYPE_LABELS[asset.type] ?? asset.type;
		(nonLiquidGroups[label] = nonLiquidGroups[label] || []).push(asset);
	}

	const liquidTotal = liquidAccounts
		.filter((a) => a.include_in_saldo !== 'false')
		.reduce((sum, a) => sum + (parseInt(a.current_balance, 10) || 0), 0);

	const nonLiquidTotal = nonLiquidAssets.reduce((sum, a) => {
		const val = parseFloat(a.current_balance) || 0;
		const satuan = a.satuan || ASSET_TYPE_SATUAN[a.type] || 'rupiah';
		if (satuan === 'rupiah') return sum + val;
		const idr = a.price_symbol ? convertAssetToIdr(val, a.price_symbol, rates) : null;
		return idr != null ? sum + idr : sum;
	}, 0);

	function mutateAll() {
		mutateAccounts();
		mutateAssets();
	}

	async function handleAdd(result: UnifiedAssetResult) {
		const isLiquid = result.kind === 'account';
		const res = isLiquid
			? await createAcc(result.data)
			: await createAsset(result.data);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Aset ditambahkan');
		setAddOpen(false);
		mutateAll();
	}

	async function handleEdit(result: UnifiedAssetResult) {
		if (!editTarget) return;
		const isLiquid = editTarget.kind === 'account';
		const res = isLiquid
			? await updateAcc({ id: editTarget.item.id, data: result.data })
			: await updateAsset({ id: editTarget.item.id, data: result.data });
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Aset diperbarui');
		setEditTarget(null);
		mutateAll();
	}

	async function handleDelete() {
		if (!editTarget) return;
		const isLiquid = editTarget.kind === 'account';
		const res = isLiquid
			? await deleteAcc(editTarget.item.id)
			: await deleteAsset(editTarget.item.id);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Aset dihapus');
		setEditTarget(null);
		mutateAll();
	}

	async function handleMoveBalance(data: { from_id: string; to_id: string; amount: number }) {
		const res = await moveBalance(data);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Saldo berhasil dipindahkan');
		setMoveOpen(false);
		mutateAll();
	}

	async function handleTransfer(data: CreateTransferInput) {
		const res = await transfer(data);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Transfer berhasil');
		setTransferOpen(false);
		mutateAll();
	}

	const isMutating =
		creatingAcc || updatingAcc || creatingAsset || updatingAsset;
	const isDeleting = deletingAcc || deletingAsset;

	return (
		<div className="space-y-4">
			<header className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-[20px] font-semibold leading-tight tracking-tight lg:text-[24px]">
						Aset
					</h2>
					<p className="mt-1 text-[13px] text-muted-foreground">
						Kelola aset likuid dan non-likuid keluarga.
					</p>
				</div>
				<div className="flex items-center gap-2">
					{liquidAccounts.length >= 2 && (
						<Button
							variant="outline"
							size="pill"
							onClick={() => setMoveOpen(true)}
							className="lg:rounded-md lg:px-4"
						>
							<ArrowLeftRight className="size-4" strokeWidth={2} />
							<span className="hidden lg:inline">Pindah Saldo</span>
						</Button>
					)}
					<Button
						variant="accent"
						size="pill"
						onClick={() => setAddOpen(true)}
						className="lg:rounded-md lg:px-4"
					>
						<Plus className="size-4" strokeWidth={2.5} />
						<span className="hidden lg:inline">Tambah Aset</span>
					</Button>
				</div>
			</header>

			{/* Tabs */}
			<div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
				{(
					[
						{
							key: 'liquid',
							label: 'Likuid',
							total: liquidTotal,
							count: liquidAccounts.length,
						},
						{
							key: 'nonliquid',
							label: 'Non-Likuid',
							total: nonLiquidTotal,
							count: nonLiquidAssets.length,
						},
					] as const
				).map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={cn(
							'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
							activeTab === tab.key
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
						)}
					>
						{tab.label}
						{tab.count > 0 && (
							<span
								className={cn(
									'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
									activeTab === tab.key ? 'bg-white/20' : 'bg-muted',
								)}
							>
								{tab.count}
							</span>
						)}
					</button>
				))}
			</div>

			{isLoading && (
				<div className="space-y-2">
					{/* Group header */}
					<div className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-2.5">
						<Skeleton className="h-3.5 w-16 rounded" />
						<Skeleton className="h-4 w-24 rounded" />
					</div>
					{/* Item rows */}
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5">
							<Skeleton className="size-10 shrink-0 rounded-full" />
							<div className="flex-1 space-y-1.5">
								<Skeleton className="h-3.5 w-28 rounded" />
								<Skeleton className="h-3 w-20 rounded" />
							</div>
							<Skeleton className="h-4 w-24 rounded" />
						</div>
					))}
				</div>
			)}
			{error && <ErrorState message={error} onRetry={mutateAll} />}

			{!isLoading && !error && activeTab === 'liquid' && (
				<LiquidTab
					groups={liquidGroups}
					total={liquidTotal}
					onAdd={() => setAddOpen(true)}
					onSelect={(acc) => setEditTarget({ kind: 'account', item: acc })}
				/>
			)}

			{!isLoading && !error && activeTab === 'nonliquid' && (
				<NonLiquidTab
					groups={nonLiquidGroups}
					total={nonLiquidTotal}
					rates={rates}
					onAdd={() => setAddOpen(true)}
					onSelect={(asset) => setEditTarget({ kind: 'asset', item: asset })}
				/>
			)}

			{/* Add dialog */}
			<Dialog
				open={addOpen}
				onOpenChange={(open) => !open && setAddOpen(false)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Aset</DialogTitle>
					</DialogHeader>
					<AssetForm
						onSubmit={handleAdd}
						onCancel={() => setAddOpen(false)}
						loading={isMutating}
					/>
				</DialogContent>
			</Dialog>

			{/* Edit dialog */}
			<Dialog
				open={!!editTarget}
				onOpenChange={(open) => !open && setEditTarget(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Aset</DialogTitle>
					</DialogHeader>
					{editTarget && (
						<AssetForm
							defaultEdit={editTarget}
							onSubmit={handleEdit}
							onCancel={() => setEditTarget(null)}
							onDelete={handleDelete}
							loading={isMutating}
							deleting={isDeleting}
						/>
					)}
				</DialogContent>
			</Dialog>

			{/* Transfer dialog */}
			<Dialog open={transferOpen} onOpenChange={setTransferOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Transfer Antar Akun</DialogTitle>
					</DialogHeader>
					<TransferForm
						onSubmit={handleTransfer}
						onCancel={() => setTransferOpen(false)}
						loading={transferring}
					/>
				</DialogContent>
			</Dialog>

			{/* Move balance dialog */}
			<Dialog open={moveOpen} onOpenChange={setMoveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Pindah Saldo</DialogTitle>
					</DialogHeader>
					<MoveBalanceForm
						accounts={liquidAccounts}
						onSubmit={handleMoveBalance}
						onCancel={() => setMoveOpen(false)}
						loading={movingBalance}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ─── Liquid Tab ───────────────────────────────────────────────────────────────

function LiquidTab({
	groups,
	total,
	onAdd,
	onSelect,
}: {
	groups: Record<string, Asset[]>;
	total: number;
	onAdd: () => void;
	onSelect: (acc: Asset) => void;
}) {
	const { isFavorite, toggleFavorite } = useFavoriteAccountIds();
	const isEmpty = Object.keys(groups).length === 0;
	if (isEmpty) {
		return (
			<EmptyState
				icon={Wallet}
				title="Belum ada aset likuid"
				description="Tambah rekening bank, dompet digital, atau tunai."
				action={
					<Button variant="accent" onClick={onAdd}>
						<Plus className="size-4" />
						Tambah Aset
					</Button>
				}
			/>
		);
	}
	return (
		<div className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
			<div className="bg-surface px-5 py-3 lg:border-b lg:border-border lg:bg-muted/40 lg:px-6">
				<p className="text-eyebrow text-muted-foreground">Total Saldo Likuid</p>
				<MoneyDisplay amount={total} className="mt-1 text-2xl lg:text-[26px]" />
			</div>
			{Object.entries(groups).map(([label, items], idx) => (
				<section
					key={label}
					className={cn(
						'mb-2 lg:mb-0',
						idx > 0 && 'lg:border-t lg:border-border/60',
					)}
				>
					<div className="px-5 pb-1 pt-2 lg:bg-muted/20 lg:py-1.5">
						<p className="text-eyebrow text-muted-foreground">{label}</p>
					</div>
					<div className="divide-y divide-border bg-surface">
						{items.map((acc) => {
							const icon = acc.icon ?? ASSET_TYPE_ICONS[acc.type] ?? 'wallet';
							const color =
								acc.color ?? ASSET_TYPE_COLORS[acc.type] ?? '#1e40af';
							const starred = isFavorite(acc.id);
							return (
								<div key={acc.id} className="flex items-center transition-colors hover:bg-muted/40">
									<button
										type="button"
										onClick={() => onSelect(acc)}
										className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5 text-left"
									>
										<span
											className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
											style={{ backgroundColor: color }}
										>
											<CategoryIcon icon={icon} className="size-5" />
										</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<p className="truncate font-medium">{acc.name}</p>
												{acc.include_in_saldo === 'false' && (
													<Badge
														variant="secondary"
														className="shrink-0 px-1.5 py-0 text-[10px]"
													>
														Dikecualikan
													</Badge>
												)}
											</div>
											<p className="truncate text-xs text-muted-foreground">
												{acc.bank_name || ASSET_TYPE_LABELS[acc.type]}
											</p>
										</div>
										<MoneyDisplay
											amount={parseInt(acc.current_balance, 10) || 0}
										/>
									</button>
									<button
										type="button"
										onClick={() => toggleFavorite(acc.id)}
										aria-label={starred ? `Hapus ${acc.name} dari favorit` : `Tambahkan ${acc.name} ke favorit`}
										className="flex size-12 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
									>
										<Star
											className={cn('size-4', starred && 'fill-accent text-accent')}
											strokeWidth={2}
										/>
									</button>
								</div>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}

// ─── Non-Liquid Tab ───────────────────────────────────────────────────────────

function NonLiquidTab({
	groups,
	total,
	rates,
	onAdd,
	onSelect,
}: {
	groups: Record<string, Asset[]>;
	total: number;
	rates: PriceRate[];
	onAdd: () => void;
	onSelect: (asset: Asset) => void;
}) {
	const isEmpty = Object.keys(groups).length === 0;
	if (isEmpty) {
		return (
			<EmptyState
				icon={Briefcase}
				title="Belum ada aset non-likuid"
				description="Tambah investasi, logam mulia, saham, crypto, atau aset nyata."
				action={
					<Button variant="accent" onClick={onAdd}>
						<Plus className="size-4" />
						Tambah Aset
					</Button>
				}
			/>
		);
	}
	return (
		<div className="space-y-2 lg:space-y-0 lg:overflow-hidden lg:rounded-lg lg:border lg:border-border lg:bg-surface">
			<div className="bg-surface px-5 py-3 lg:border-b lg:border-border lg:bg-muted/40 lg:px-6">
				<p className="text-eyebrow text-muted-foreground">
					Total Nilai Non-Likuid
				</p>
				<MoneyDisplay amount={total} className="mt-1 text-2xl lg:text-[26px]" />
			</div>
			{Object.entries(groups).map(([label, items], idx) => (
				<section
					key={label}
					className={cn(
						'mb-2 lg:mb-0',
						idx > 0 && 'lg:border-t lg:border-border/60',
					)}
				>
					<div className="px-5 pb-1 pt-2 lg:bg-muted/20 lg:py-1.5">
						<p className="text-eyebrow text-muted-foreground">{label}</p>
					</div>
					<div className="divide-y divide-border bg-surface">
						{items.map((asset) => {
							const icon =
								asset.icon ?? ASSET_TYPE_ICONS[asset.type] ?? 'briefcase';
							const color =
								asset.color ?? ASSET_TYPE_COLORS[asset.type] ?? '#64748b';
							return (
								<button
									key={asset.id}
									type="button"
									onClick={() => onSelect(asset)}
									className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
								>
									<span
										className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
										style={{ backgroundColor: color }}
									>
										<CategoryIcon icon={icon} className="size-5" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-1.5">
											<p className="truncate font-medium">{asset.name}</p>
											{asset.include_in_saldo === 'true' && (
												<Badge
													variant="success"
													className="shrink-0 px-1.5 py-0 text-[10px]"
												>
													Dihitung
												</Badge>
											)}
											{(asset.satuan || ASSET_TYPE_SATUAN[asset.type] || 'rupiah') !== 'rupiah' && !asset.price_symbol && (
												<Badge
													variant="warning"
													className="shrink-0 px-1.5 py-0 text-[10px]"
												>
													Konverter belum dipilih
												</Badge>
											)}
										</div>
										<p className="truncate text-xs text-muted-foreground">
											{ASSET_TYPE_LABELS[asset.type] ?? asset.type}
										</p>
									</div>
									<QuantityDisplay
										value={parseFloat(asset.current_balance) || 0}
										satuan={asset.satuan || ASSET_TYPE_SATUAN[asset.type] || 'rupiah'}
										idrValue={(() => {
											const satuan = asset.satuan || ASSET_TYPE_SATUAN[asset.type] || 'rupiah';
											if (satuan === 'rupiah') return null;
											return asset.price_symbol
												? convertAssetToIdr(parseFloat(asset.current_balance) || 0, asset.price_symbol, rates)
												: null;
										})()}
									/>
								</button>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}
