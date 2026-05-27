'use client'

import { useState } from 'react'
import { History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/sections/empty-state'
import { ErrorState } from '@/components/sections/error-state'
import { CategoryIcon } from '@/components/finance/category-icon'
import { MonthPicker } from '@/components/finance/month-picker'
import { useAssetMutations } from '@/hooks/use-asset-mutations'
import { cn } from '@/lib/utils'

const IDR = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function getDefaultMonth() {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// description for pindah_saldo is encoded as "fromName||toName"
function parseTransferNames(desc: string): { from: string; to: string } {
	const parts = desc.split('||')
	return { from: parts[0] ?? '—', to: parts[1] ?? '—' }
}

export function AssetLogPanel() {
	const [month, setMonth] = useState<string>(getDefaultMonth())
	const { mutations, isLoading, error } = useAssetMutations(null)

	const filtered = mutations
		.filter((m) => m.created_at.startsWith(month))
		.sort((a, b) => b.created_at.localeCompare(a.created_at))

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<p className="text-[13px] text-muted-foreground">
					{filtered.length > 0 ? `${filtered.length} entri` : 'Log perubahan nilai aset'}
				</p>
				<MonthPicker value={month} onChange={setMonth} />
			</div>

			{isLoading && (
				<div className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="grid grid-cols-[80px_110px_1fr_120px_80px] gap-x-3 border-b border-border bg-muted/40 px-4 py-2">
						{[40, 80, 60, 60, 50].map((w, i) => (
							<Skeleton key={i} className="h-3 rounded" style={{ width: w }} />
						))}
					</div>
					{[0, 1, 2, 3].map((i) => (
						<div key={i} className="grid grid-cols-[80px_110px_1fr_120px_80px] gap-x-3 border-b border-border/60 px-4 py-3 last:border-0">
							<Skeleton className="h-3.5 w-14 rounded" />
							<Skeleton className="h-3.5 w-20 rounded" />
							<Skeleton className="h-3.5 w-32 rounded" />
							<Skeleton className="h-3.5 w-20 rounded" />
							<Skeleton className="h-3.5 w-16 rounded" />
						</div>
					))}
				</div>
			)}

			{error && <ErrorState message={error} />}

			{!isLoading && !error && filtered.length === 0 && (
				<EmptyState
					icon={History}
					title="Belum ada log"
					description="Belum ada perubahan nilai aset di bulan ini."
				/>
			)}

			{!isLoading && !error && filtered.length > 0 && (
				<div className="overflow-hidden rounded-xl border border-border bg-surface">
					<div className="hidden grid-cols-[80px_110px_1fr_120px_80px] gap-x-3 border-b border-border bg-muted/40 px-4 py-2 lg:grid">
						<p className="text-eyebrow text-muted-foreground">Tanggal</p>
						<p className="text-eyebrow text-muted-foreground">Aktivitas</p>
						<p className="text-eyebrow text-muted-foreground">Aset</p>
						<p className="text-eyebrow text-right text-muted-foreground">Nilai</p>
						<p className="text-eyebrow text-muted-foreground">Oleh</p>
					</div>

					<div className="divide-y divide-border">
						{filtered.map((m) => {
							const isPindah = m.mutation_category === 'pindah_saldo'
							const isRupiah = (m.satuan || 'rupiah') === 'rupiah'
							const delta = parseFloat(m.delta)
							const newBal = parseFloat(m.new_balance)

							const dt = new Date(m.created_at)
							const dateStr = dt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

							const categoryLabel = isPindah ? 'Pindah Saldo' : 'Penyesuaian'
							const categoryVariant: 'secondary' | 'outline' = isPindah ? 'secondary' : 'outline'

							let asetText: string
							if (isPindah) {
								const { from, to } = parseTransferNames(m.description ?? '')
								asetText = `${from} → ${to}`
							} else {
								asetText = m.asset_name ?? m.asset_id
							}
							const assetColor = isPindah ? undefined : m.asset_color
							const assetIcon = isPindah ? undefined : m.asset_icon

							const absVal = isRupiah ? IDR.format(Math.abs(delta)) : `${Math.abs(delta)} ${m.satuan}`
							const newBalStr = isRupiah ? IDR.format(newBal) : `${newBal} ${m.satuan}`
							let valuePrefix = ''
							let valueColor = 'text-foreground'
							if (!isPindah) {
								if (m.mutation_type === 'increase') { valuePrefix = '+'; valueColor = 'text-success' }
								else if (m.mutation_type === 'decrease') { valuePrefix = '−'; valueColor = 'text-destructive' }
							}

							const byName = m.created_by_name ?? m.created_by

							return (
								<div key={m.id} className="px-4 py-3">
									{/* Mobile */}
									<div className="flex items-start gap-3 lg:hidden">
										<div className="mt-0.5 min-w-[56px] shrink-0">
											<p className="text-[12px] font-medium tabular-nums">{dateStr}</p>
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												{assetColor && assetIcon && (
													<span className="flex size-4 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: assetColor }}>
														<CategoryIcon icon={assetIcon} className="size-2.5" />
													</span>
												)}
												<p className="truncate text-[13px] font-medium">{asetText}</p>
											</div>
											<p className="text-[11px] text-muted-foreground">{categoryLabel}</p>
										</div>
										<div className="shrink-0 text-right">
											<p className={cn('text-[13px] font-semibold tabular-nums', valueColor)}>
												{valuePrefix}{absVal}
											</p>
											<p className="text-[11px] text-muted-foreground tabular-nums">→ {newBalStr}</p>
										</div>
									</div>

									{/* Desktop */}
									<div className="hidden grid-cols-[80px_110px_1fr_120px_80px] items-center gap-x-3 lg:grid">
										<div>
											<p className="text-[12px] font-medium tabular-nums">{dateStr}</p>
										</div>
										<div>
											<Badge variant={categoryVariant} className="px-1.5 py-0 text-[10px]">
												{categoryLabel}
											</Badge>
										</div>
										<div className="flex min-w-0 items-center gap-1.5">
											{assetColor && assetIcon && (
												<span className="flex size-5 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: assetColor }}>
													<CategoryIcon icon={assetIcon} className="size-3" />
												</span>
											)}
											<p className="truncate text-[13px] font-medium">{asetText}</p>
										</div>
										<div className="text-right">
											<p className={cn('text-[13px] font-semibold tabular-nums', valueColor)}>
												{valuePrefix}{absVal}
											</p>
											<p className="text-[11px] text-muted-foreground tabular-nums">→ {newBalStr}</p>
										</div>
										<div>
											<p className="truncate text-[12px] text-muted-foreground">{byName}</p>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			)}
		</div>
	)
}
