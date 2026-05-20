'use client';

import { useMemo, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { CategoryIcon } from '@/components/finance/category-icon';
import { formatMoney, formatMoneyCompact } from '@/lib/money';
import { groupByDate } from '@/domain/transactions';
import type { Transaction, TransactionCategory, Asset } from '@/domain/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function dayNet(txs: Transaction[]): {
	income: number;
	expense: number;
	net: number;
} {
	let income = 0,
		expense = 0;
	for (const tx of txs) {
		const amt = parseInt(tx.amount, 10) || 0;
		if (tx.type === 'income' || tx.type === 'refund') income += amt;
		else if (tx.type === 'expense') expense += amt;
	}
	return { income, expense, net: income - expense };
}

export function ReportCalendar({
	transactions,
	categories,
	accounts,
	year,
	month,
}: {
	transactions: Transaction[];
	categories: TransactionCategory[];
	accounts: Asset[];
	year: number;
	month: number;
}) {
	const [selectedDate, setSelectedDate] = useState<string | null>(null);

	const txByDate = useMemo(() => groupByDate(transactions), [transactions]);
	const catMap = useMemo(
		() => Object.fromEntries(categories.map((c) => [c.id, c])),
		[categories],
	);
	const accMap = useMemo(
		() => Object.fromEntries(accounts.map((a) => [a.id, a])),
		[accounts],
	);

	const daysInMonth = new Date(year, month, 0).getDate();
	const firstDay = new Date(year, month - 1, 1).getDay();
	const startOffset = firstDay === 0 ? 6 : firstDay - 1;

	const pad = (n: number) => String(n).padStart(2, '0');

	const selectedTxs = selectedDate ? (txByDate[selectedDate] ?? []) : [];
	const selectedNet = selectedDate ? dayNet(selectedTxs) : null;

	return (
		<>
			<div className="rounded-2xl border border-border bg-surface p-5">
				<div className="mb-4">
					<p className="text-[10.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
						Kalender
					</p>
					<p className="font-bold text-[15px] tracking-tight mt-0.5">
						Aktivitas Transaksi
					</p>
				</div>

				{/* Day headers */}
				<div className="grid grid-cols-7 mb-1">
					{DAYS.map((d) => (
						<div
							key={d}
							className="text-center text-[10px] font-semibold text-muted-foreground py-1"
						>
							{d}
						</div>
					))}
				</div>

				{/* Calendar grid */}
				<div className="grid grid-cols-7 gap-0.5">
					{Array.from({ length: startOffset }, (_, i) => (
						<div key={`empty-${i}`} />
					))}
					{Array.from({ length: daysInMonth }, (_, i) => {
						const day = i + 1;
						const dateStr = `${year}-${pad(month)}-${pad(day)}`;
						const txs = txByDate[dateStr] ?? [];
						const { income, expense, net } = dayNet(txs);
						const hasData = txs.length > 0;
						const today = new Date();
						const isToday =
							today.getFullYear() === year &&
							today.getMonth() + 1 === month &&
							today.getDate() === day;

						return (
							<button
								key={day}
								type="button"
								onClick={() => hasData && setSelectedDate(dateStr)}
								className={cn(
									'relative flex flex-col items-center rounded-xl p-1.5 text-center transition-colors min-h-[52px] sm:min-h-[60px]',
									hasData && 'cursor-pointer hover:bg-muted/50',
									!hasData && 'cursor-default',
									selectedDate === dateStr &&
										'ring-2 ring-primary ring-offset-1',
									isToday && 'ring-1 ring-border',
								)}
							>
								<span
									className={cn(
										'text-[11px] font-semibold tabular-nums',
										isToday ? 'text-primary' : 'text-foreground',
									)}
								>
									{day}
								</span>
								{hasData && (
									<span
										className="mt-1.5 text-[12px] font-bold tabular-nums leading-none"
										style={{
											color: net >= 0 ? 'var(--success)' : 'var(--danger)',
										}}
									>
										{net >= 0 ? '+' : '-'}
										{formatMoneyCompact(Math.abs(net)).replace('Rp ', '')}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Legend */}
				<div className="flex items-center gap-4 pt-3 border-t border-border mt-3">
					<div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: 'var(--success)' }}
						/>
						Net positif
					</div>
					<div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
						<span
							className="size-2 rounded-full"
							style={{ backgroundColor: 'var(--danger)' }}
						/>
						Net negatif
					</div>
					<p className="ml-auto text-[10.5px] text-muted-foreground">
						Tap hari untuk detail
					</p>
				</div>
			</div>

			{/* Day detail dialog */}
			<Dialog
				open={!!selectedDate}
				onOpenChange={(o) => !o && setSelectedDate(null)}
			>
				<DialogContent className="max-w-[420px] max-h-[80dvh] flex flex-col gap-0 p-0">
					<DialogHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
						<DialogTitle>
							{selectedDate
								? format(
										new Date(selectedDate + 'T00:00:00'),
										'EEEE, d MMMM yyyy',
										{
											locale: idLocale,
										},
									)
								: ''}
						</DialogTitle>
						{selectedNet && (
							<div className="flex gap-4 mt-2 text-[12px]">
								<span style={{ color: 'var(--success)' }}>
									+{formatMoneyCompact(selectedNet.income)}
								</span>
								<span style={{ color: 'var(--danger)' }}>
									-{formatMoneyCompact(selectedNet.expense)}
								</span>
								<span
									className="font-semibold"
									style={{
										color:
											selectedNet.net >= 0 ? 'var(--success)' : 'var(--danger)',
									}}
								>
									Net {selectedNet.net >= 0 ? '+' : ''}
									{formatMoneyCompact(selectedNet.net)}
								</span>
							</div>
						)}
					</DialogHeader>
					<div className="flex-1 overflow-y-auto divide-y divide-border">
						{selectedTxs
							.sort((a, b) => parseInt(b.amount, 10) - parseInt(a.amount, 10))
							.map((tx) => {
								const cat = catMap[tx.category_id ?? ''];
								const acc = accMap[tx.account_id];
								const amt = parseInt(tx.amount, 10) || 0;
								const isIncome = tx.type === 'income' || tx.type === 'refund';
								return (
									<div
										key={tx.id}
										className="flex items-center gap-3 px-5 py-3.5"
									>
										<span
											className="size-9 shrink-0 rounded-xl flex items-center justify-center"
											style={{
												background: `${cat?.color ?? '#64748b'}1f`,
												color: cat?.color ?? '#64748b',
											}}
										>
											<CategoryIcon
												icon={cat?.icon ?? 'tag'}
												className="size-4"
											/>
										</span>
										<div className="flex-1 min-w-0">
											<p className="truncate text-[13px] font-semibold">
												{tx.description}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{acc?.name ?? '—'}
											</p>
										</div>
										<span
											className={cn(
												'tabular-nums font-bold text-[13.5px] shrink-0',
												isIncome ? 'text-success' : 'text-danger',
											)}
										>
											{isIncome ? '+' : '-'}
											{formatMoney(amt)}
										</span>
									</div>
								);
							})}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
