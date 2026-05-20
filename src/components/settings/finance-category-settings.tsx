'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Tags, Pencil, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { CategoryForm } from '@/components/finance/category-form';
import { CategoryIcon } from '@/components/finance/category-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/sections/empty-state';
import { ErrorState } from '@/components/sections/error-state';
import {
	useCategories,
	useCreateCategory,
	useDeleteCategory,
	useUpdateCategory,
	useSeedCategories,
} from '@/hooks/use-categories';
import { CATEGORY_TYPE_LABELS, getCategoryBranches } from '@/domain/categories';
import { BUDGET_TYPE_LABELS, BUDGET_TYPE_COLORS } from '@/domain/constants';
import { cn } from '@/lib/utils';
import type {
	BudgetType,
	CategoryType,
	CreateTransactionCategoryInput,
	TransactionCategory,
} from '@/domain/types';

export function FinanceCategorySettings() {
	const { categories, isLoading, error, mutate } = useCategories();
	const { trigger: createCategory, isMutating: creating } = useCreateCategory();
	const { trigger: updateCategory, isMutating: updating } = useUpdateCategory();
	const { trigger: deleteCategory, isMutating: deleting } = useDeleteCategory();
	const { trigger: seedCategories, isMutating: seeding } = useSeedCategories();

	const [activeType, setActiveType] = useState<CategoryType>('expense');
	const [createDefaults, setCreateDefaults] =
		useState<Partial<TransactionCategory> | null>(null);
	const [editCategory, setEditCategory] = useState<TransactionCategory | null>(
		null,
	);
	const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(
		new Set(),
	);
	const branches = getCategoryBranches(categories, activeType);

	function toggleBranch(id: string) {
		setCollapsedBranches((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}

	async function handleSeed() {
		const res = await seedCategories();
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success(`${res.data.seeded} kategori default berhasil dimuat`);
		mutate();
	}

	async function handleCreate(data: CreateTransactionCategoryInput) {
		const res = await createCategory(data);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Kategori ditambahkan');
		setCreateDefaults(null);
		mutate();
	}

	async function handleUpdate(data: CreateTransactionCategoryInput) {
		if (!editCategory) return;
		const res = await updateCategory({ id: editCategory.id, data });
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Kategori diperbarui');
		setEditCategory(null);
		mutate();
	}

	async function handleDelete() {
		if (!editCategory) return;
		const res = await deleteCategory(editCategory.id);
		if (!res.ok) {
			toast.error(res.error);
			return;
		}
		toast.success('Kategori dihapus');
		setEditCategory(null);
		mutate();
	}

	return (
		<div className="space-y-4">
			<header className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-[20px] font-semibold leading-tight tracking-tight lg:text-[24px]">
						Kategori
					</h2>
					<p className="mt-1 text-[13px] text-muted-foreground">
						Atur kategori transaksi keluarga.
					</p>
				</div>
				<Button
					onClick={() => setCreateDefaults({ type: activeType, parent_id: '' })}
					variant="accent"
					size="pill"
					className="lg:rounded-md lg:px-4"
				>
					<Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
					Tambah Kategori
				</Button>
			</header>

			<div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-1">
				{(['expense', 'income', 'transfer'] as CategoryType[]).map((type) => (
					<button
						key={type}
						type="button"
						onClick={() => setActiveType(type)}
						className={cn(
							'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
							activeType === type
								? 'bg-accent text-accent-foreground'
								: 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
						)}
					>
						{CATEGORY_TYPE_LABELS[type]}
					</button>
				))}
			</div>

			{isLoading && (
				<div className="space-y-2">
					{/* 2 expanded branches */}
					{[0, 1].map((i) => (
						<div key={i} className="overflow-hidden rounded-xl border border-border">
							<div className="flex items-center gap-3 px-4 py-3">
								<Skeleton className="size-8 shrink-0 rounded-lg" />
								<Skeleton className="h-4 flex-1 rounded" />
								<Skeleton className="h-4 w-16 rounded" />
							</div>
							{[0, 1].map((j) => (
								<div key={j} className="flex items-center gap-3 border-t border-border bg-muted/20 px-4 py-2.5">
									<Skeleton className="ml-8 size-6 shrink-0 rounded-md" />
									<Skeleton className="h-3.5 flex-1 rounded" />
								</div>
							))}
						</div>
					))}
					{/* 3 collapsed branches */}
					{[0, 1, 2].map((i) => (
						<div key={i} className="overflow-hidden rounded-xl border border-border">
							<div className="flex items-center gap-3 px-4 py-3">
								<Skeleton className="size-8 shrink-0 rounded-lg" />
								<Skeleton className="h-4 flex-1 rounded" />
								<Skeleton className="h-4 w-16 rounded" />
							</div>
						</div>
					))}
				</div>
			)}
			{error && <ErrorState message={error} onRetry={() => mutate()} />}

			{!isLoading && !error && branches.length === 0 && (
				<EmptyState
					icon={Tags}
					title={`Belum ada kategori ${CATEGORY_TYPE_LABELS[activeType].toLowerCase()}`}
					description="Muat kategori default keluarga, atau buat kategori sendiri dari awal."
					action={
						<div className="flex flex-col items-center gap-2 sm:flex-row">
							{categories.length === 0 && (
								<Button
									variant="accent"
									onClick={handleSeed}
									disabled={seeding}
									aria-busy={seeding}
								>
									<Sparkles
										className="size-4"
										strokeWidth={2.25}
										aria-hidden="true"
									/>
									{seeding ? 'Memuat...' : 'Muat Kategori Default'}
								</Button>
							)}
							<Button
								variant="outline"
								onClick={() =>
									setCreateDefaults({ type: activeType, parent_id: '' })
								}
							>
								<Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
								Buat Manual
							</Button>
						</div>
					}
				/>
			)}

			{!isLoading && !error && branches.length > 0 && (
				<div className="space-y-3">
					{branches.map((branch) => {
						const hasChildren = branch.children.length > 0;
						const isCollapsed = collapsedBranches.has(branch.parent.id);

						return (
							<section
								key={branch.parent.id}
								className="overflow-hidden rounded-xl border border-border bg-surface"
							>
								{/* Parent header */}
								<div
									className={cn(
										'flex items-center gap-2 bg-muted/40 px-4 py-3.5',
										hasChildren && !isCollapsed && 'border-b border-border',
									)}
								>
									{/* Toggle chevron on LEFT — only for parents with children */}
									{hasChildren ? (
										<button
											type="button"
											onClick={() => toggleBranch(branch.parent.id)}
											aria-label={
												isCollapsed
													? 'Buka kategori anak'
													: 'Tutup kategori anak'
											}
											className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
										>
											<ChevronDown
												className={cn(
													'size-4 transition-transform duration-200',
													isCollapsed && '-rotate-90',
												)}
												strokeWidth={2}
												aria-hidden="true"
											/>
										</button>
									) : (
										<div className="size-8 shrink-0" aria-hidden="true" />
									)}

									{/* Icon + color */}
									<span
										className="inline-flex size-9 shrink-0 items-center justify-center rounded-pill border border-border/60"
										style={{
											backgroundColor: branch.parent.color || '#64748b',
										}}
										aria-hidden="true"
									>
										<CategoryIcon
											icon={branch.parent.icon ?? 'tag'}
											className="size-4 text-white"
										/>
									</span>

									{/* Name + budget_type badge + sub-label */}
									<div className="min-w-0 flex-1">
										<div className="flex min-w-0 items-center gap-1.5">
											<p className="truncate font-medium">
												{branch.parent.name}
											</p>
											{branch.parent.type === 'expense' &&
												branch.parent.budget_type && (
													<span
														className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
														style={{
															color:
																BUDGET_TYPE_COLORS[
																	branch.parent.budget_type as BudgetType
																],
															backgroundColor: `${BUDGET_TYPE_COLORS[branch.parent.budget_type as BudgetType]}22`,
														}}
													>
														{
															BUDGET_TYPE_LABELS[
																branch.parent.budget_type as BudgetType
															]
														}
													</span>
												)}
										</div>
										<p className="truncate text-xs text-muted-foreground">
											{hasChildren
												? `${branch.children.length} kategori anak`
												: 'Bisa dipakai langsung di transaksi'}
										</p>
									</div>

									{/* Right: + Anak + Edit */}
									<div className="flex shrink-0 items-center gap-1">
										{hasChildren && activeType !== 'transfer' && (
											<button
												type="button"
												onClick={() =>
													setCreateDefaults({
														type: branch.parent.type,
														parent_id: branch.parent.id,
														color: branch.parent.color,
														icon: branch.parent.icon,
													})
												}
												className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
											>
												<Plus
													className="size-3"
													strokeWidth={2.5}
													aria-hidden="true"
												/>
												Anak
											</button>
										)}
										<button
											type="button"
											onClick={() => setEditCategory(branch.parent)}
											aria-label={`Edit ${branch.parent.name}`}
											className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
										>
											<Pencil
												className="size-4"
												strokeWidth={2}
												aria-hidden="true"
											/>
										</button>
									</div>
								</div>

								{/* Child rows — indented to sit under parent name */}
								{hasChildren && !isCollapsed && (
									<div className="divide-y divide-border">
										{branch.children.map((category) => (
											<button
												key={category.id}
												type="button"
												onClick={() => setEditCategory(category)}
												className="flex w-full items-center gap-3 py-3 pl-14 pr-4 text-left transition-colors hover:bg-muted/40"
											>
												<span
													className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60"
													style={{
														backgroundColor: category.color || '#64748b',
													}}
													aria-hidden="true"
												>
													<CategoryIcon
														icon={category.icon ?? 'tag'}
														className="size-3.5 text-white"
													/>
												</span>
												<p className="min-w-0 flex-1 truncate text-sm font-medium">
													{category.name}
												</p>
												<Pencil
													className="size-4 shrink-0 text-muted-foreground"
													strokeWidth={2}
													aria-hidden="true"
												/>
											</button>
										))}
									</div>
								)}
							</section>
						);
					})}
				</div>
			)}

			<Dialog
				open={!!createDefaults}
				onOpenChange={(open) => !open && setCreateDefaults(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Tambah Kategori</DialogTitle>
					</DialogHeader>
					{createDefaults && (
						<CategoryForm
							categories={categories}
							defaultValues={createDefaults}
							onSubmit={handleCreate}
							onCancel={() => setCreateDefaults(null)}
							loading={creating}
							forceType={
								createDefaults.parent_id
									? (createDefaults.type as CategoryType)
									: undefined
							}
						/>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!editCategory}
				onOpenChange={(open) => !open && setEditCategory(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Kategori</DialogTitle>
					</DialogHeader>
					{editCategory && (
						<CategoryForm
							categories={categories}
							defaultValues={editCategory}
							onSubmit={handleUpdate}
							onCancel={() => setEditCategory(null)}
							onDelete={handleDelete}
							loading={updating}
							deleting={deleting}
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
