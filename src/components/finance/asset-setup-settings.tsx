'use client';

import { useState } from 'react';
import { Plus, ArrowLeftRight, Trash2, Wallet, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/sections/empty-state';
import { ListSkeleton } from '@/components/sections/loading-state';
import { ErrorState } from '@/components/sections/error-state';
import { MoneyDisplay } from '@/components/finance/money-display';
import {
	AssetForm,
	type UnifiedAssetResult,
} from '@/components/finance/asset-form';
import { TransferForm } from '@/components/finance/transfer-form';
import { CategoryIcon } from '@/components/finance/category-icon';
import {
	useAccounts,
	useCreateAccount,
	useUpdateAccount,
	useDeleteAccount,
	useCreateTransfer,
} from '@/hooks/use-accounts';
import {
	useAssets,
	useCreateAsset,
	useUpdateAsset,
	useDeleteAsset,
} from '@/hooks/use-assets';
import {
	ACCOUNT_TYPE_LABELS,
	ASSET_TYPE_LABELS,
	ASSET_TYPE_ICONS,
	ASSET_TYPE_COLORS,
	LIQUID_ACCOUNT_TYPES,
	NON_LIQUID_ASSET_TYPES,
} from '@/domain/constants';
import { cn } from '@/lib/utils';
import type {
	Account,
	Asset,
	CreateAccountInput,
	CreateAssetInput,
	CreateTransferInput,
} from '@/domain/types';

type ActiveTab = 'liquid' | 'nonliquid';

type EditTarget =
	| { kind: 'account'; item: Account }
	| { kind: 'asset'; item: Asset };

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
	const { trigger: createAsset, isMutating: creatingAsset } = useCreateAsset();
	const { trigger: updateAsset, isMutating: updatingAsset } = useUpdateAsset();
	const { trigger: deleteAsset, isMutating: deletingAsset } = useDeleteAsset();

	const [activeTab, setActiveTab] = useState<ActiveTab>('liquid');
	const [addOpen, setAddOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
	const [transferOpen, setTransferOpen] = useState(false);

	const isLoading = accLoading || assetLoading;
	const error = accError || assetError;

	const liquidAccounts = accounts.filter((a) =>
		(LIQUID_ACCOUNT_TYPES as readonly string[]).includes(a.type),
	);
	const nonLiquidAssets = assets;

	// Group liquid accounts by type
	const liquidGroups: Record<string, Account[]> = {};
	for (const acc of liquidAccounts) {
		const label = ACCOUNT_TYPE_LABELS[acc.type] ?? acc.type;
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

	const nonLiquidTotal = nonLiquidAssets.reduce(
		(sum, a) => sum + (parseInt(a.value, 10) || 0),
		0,
	);

	function mutateAll() {
		mutateAccounts();
		mutateAssets();
	}

	async function handleAdd(result: UnifiedAssetResult) {
		if (result.kind === 'account') {
			const res = await createAcc(result.data as CreateAccountInput);
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success('Aset ditambahkan');
		} else {
			const res = await createAsset(result.data as CreateAssetInput);
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success('Aset ditambahkan');
		}
		setAddOpen(false);
		mutateAll();
	}

	async function handleEdit(result: UnifiedAssetResult) {
		if (!editTarget) return;
		if (result.kind === 'account' && editTarget.kind === 'account') {
			const res = await updateAcc({
				id: editTarget.item.id,
				data: result.data as CreateAccountInput,
			});
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success('Aset diperbarui');
		} else if (result.kind === 'asset' && editTarget.kind === 'asset') {
			const res = await updateAsset({
				id: editTarget.item.id,
				data: result.data as CreateAssetInput,
			});
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success('Aset diperbarui');
		}
		setEditTarget(null);
		mutateAll();
	}

	async function handleDelete() {
		if (!editTarget) return;
		if (editTarget.kind === 'account') {
			const res = await deleteAcc(editTarget.item.id);
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
		} else {
			const res = await deleteAsset(editTarget.item.id);
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
		}
		toast.success('Aset dihapus');
		setEditTarget(null);
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

			{isLoading && <ListSkeleton count={4} />}
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
	groups: Record<string, Account[]>;
	total: number;
	onAdd: () => void;
	onSelect: (acc: Account) => void;
}) {
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
							return (
								<button
									key={acc.id}
									type="button"
									onClick={() => onSelect(acc)}
									className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/40"
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
											{acc.bank_name || ACCOUNT_TYPE_LABELS[acc.type]}
										</p>
									</div>
									<MoneyDisplay
										amount={parseInt(acc.current_balance, 10) || 0}
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

// ─── Non-Liquid Tab ───────────────────────────────────────────────────────────

function NonLiquidTab({
	groups,
	total,
	onAdd,
	onSelect,
}: {
	groups: Record<string, Asset[]>;
	total: number;
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
										<div className="flex items-center gap-1.5">
											<p className="truncate font-medium">{asset.name}</p>
											{asset.include_in_saldo === 'true' && (
												<Badge
													variant="success"
													className="shrink-0 px-1.5 py-0 text-[10px]"
												>
													Dihitung
												</Badge>
											)}
										</div>
										<p className="truncate text-xs text-muted-foreground">
											{ASSET_TYPE_LABELS[asset.type] ?? asset.type}
										</p>
									</div>
									<MoneyDisplay amount={parseInt(asset.value, 10) || 0} />
								</button>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}
