'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
	AlertTriangle,
	CalendarDays,
	CheckCircle2,
	Clock,
	Copy,
	FileText,
	MoreVertical,
	Pencil,
	Plus,
	Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/sections/empty-state';
import { ErrorState } from '@/components/sections/error-state';
import { MoneyDisplay } from '@/components/finance/money-display';
import { MoneyInput } from '@/components/finance/money-input';
import { MonthPicker } from '@/components/finance/month-picker';
import { StatusChip } from '@/components/finance/status-chip';
import { PageContainer } from '@/components/layout/page-container';
import { MobileBackButton } from '@/components/nav/mobile-back-button';
import {
	useBills,
	useBillPayments,
	useCreateBill,
	useUpdateBill,
	useDeleteBill,
	usePayBill,
} from '@/hooks/use-bills';
import { useCategories } from '@/hooks/use-categories';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Bill, BillPayment, CreateBillInput } from '@/domain/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MONTH_NAMES_ID = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function currentYM() {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthYM(ym: string): string {
	const [y, m] = ym.split('-').map(Number);
	// new Date(y, m, 1): m is 1-indexed → this gives month index m (0-indexed) = next month
	const d = new Date(y, m, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthFullLabel(ym: string): string {
	const [y, m] = ym.split('-').map(Number);
	return `${MONTH_NAMES_ID[m - 1]} ${y}`;
}

const BILL_COLORS = [
	'#6366f1', '#ec4899', '#f59e0b', '#10b981',
	'#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
	'#f97316', '#84cc16',
];

function getBillColor(name: string): string {
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = (hash << 5) - hash + name.charCodeAt(i);
		hash |= 0;
	}
	return BILL_COLORS[Math.abs(hash) % BILL_COLORS.length];
}

type BillStatus = 'paid' | 'unpaid' | 'due-soon' | 'overdue';

function getBillStatus(
	bill: Bill,
	payments: BillPayment[],
	month: string,
): BillStatus {
	const isPaid = payments.some(
		(p) => p.bill_id === bill.id && p.paid_at.startsWith(month),
	);
	if (isPaid) return 'paid';

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const due = new Date(bill.due_date);
	due.setHours(0, 0, 0, 0);
	const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);

	if (diffDays < 0) return 'overdue';
	if (diffDays <= 7) return 'due-soon';
	return 'unpaid';
}

function formatDueDate(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	} catch {
		return dateStr;
	}
}

function formatDueDateShort(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'short',
		});
	} catch {
		return dateStr;
	}
}

// ── Summary Card ───────────────────────────────────────────────────────────────

function SummaryCard({
	label,
	count,
	amount,
	accent,
}: {
	label: string;
	count: number;
	amount: number;
	accent?: string;
}) {
	return (
		<div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4">
			<p className="text-eyebrow text-muted-foreground">{label}</p>
			<p
				className="tabular-nums text-xl font-bold leading-tight tracking-tight"
				style={accent ? { color: accent } : undefined}
			>
				{formatMoney(amount)}
			</p>
			<p className="text-[11px] text-muted-foreground">{count} tagihan</p>
		</div>
	);
}

// ── Bill Row ───────────────────────────────────────────────────────────────────

function BillRow({
	bill,
	status,
	onEdit,
	onDuplicate,
	onDelete,
	onPay,
}: {
	bill: Bill;
	status: BillStatus;
	onEdit: (bill: Bill) => void;
	onDuplicate: (bill: Bill) => void;
	onDelete: (bill: Bill) => void;
	onPay: (bill: Bill) => void;
}) {
	const color = getBillColor(bill.name);
	const initial = bill.name.charAt(0).toUpperCase();

	return (
		<div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
			{/* Avatar */}
			<span
				className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
				style={{ backgroundColor: color }}
			>
				{initial}
			</span>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium">{bill.name}</p>
				<p className="mt-0.5 text-xs text-muted-foreground">
					Jatuh tempo {formatDueDate(bill.due_date)}
				</p>
			</div>

			{/* Amount + status */}
			<div className="flex shrink-0 flex-col items-end gap-1.5">
				<MoneyDisplay
					amount={parseInt(bill.amount, 10)}
					className="text-sm font-semibold tabular-nums"
				/>
				<StatusChip status={status} />
			</div>

			{/* Actions */}
			<div className="flex shrink-0 items-center gap-1">
				{status !== 'paid' && (
					<Button
						size="sm"
						variant="accent"
						className="h-8 px-3 text-xs"
						onClick={() => onPay(bill)}
					>
						Bayar
					</Button>
				)}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="size-8">
							<MoreVertical className="size-4" aria-hidden="true" />
							<span className="sr-only">Opsi</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(bill)}>
							<Pencil className="mr-2 size-4" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onDuplicate(bill)}>
							<Copy className="mr-2 size-4" />
							Duplikat
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => onDelete(bill)}
						>
							<Trash2 className="mr-2 size-4" />
							Hapus
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

// ── Bill Group Section ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
	BillStatus,
	{
		label: string;
		color: string;
		Icon: React.ComponentType<{
			className?: string;
			style?: React.CSSProperties;
		}>;
	}
> = {
	overdue: { label: 'Terlambat', color: '#ef4444', Icon: AlertTriangle },
	'due-soon': { label: 'Segera Jatuh Tempo', color: '#f59e0b', Icon: Clock },
	unpaid: { label: 'Belum Bayar', color: '#6b7280', Icon: FileText },
	paid: { label: 'Sudah Lunas', color: '#10b981', Icon: CheckCircle2 },
};

function BillGroupSection({
	status,
	bills,
	payments,
	month,
	onEdit,
	onDuplicate,
	onDelete,
	onPay,
}: {
	status: BillStatus;
	bills: Bill[];
	payments: BillPayment[];
	month: string;
	onEdit: (bill: Bill) => void;
	onDuplicate: (bill: Bill) => void;
	onDelete: (bill: Bill) => void;
	onPay: (bill: Bill) => void;
}) {
	if (bills.length === 0) return null;

	const cfg = STATUS_CONFIG[status];
	const Icon = cfg.Icon;
	const total = bills.reduce((s, b) => s + parseInt(b.amount, 10), 0);

	return (
		<section>
			<div
				className="flex items-center justify-between gap-3 px-5 py-2.5"
				style={{ borderLeft: `3px solid ${cfg.color}` }}
			>
				<div className="flex items-center gap-2">
					<Icon
						className="size-3.5"
						style={{ color: cfg.color } as React.CSSProperties}
					/>
					<p className="text-[12px] font-semibold" style={{ color: cfg.color }}>
						{cfg.label}
					</p>
					<span className="text-[11px] text-muted-foreground">
						({bills.length})
					</span>
				</div>
				<p className="text-[12px] font-semibold tabular-nums text-muted-foreground">
					{formatMoney(total)}
				</p>
			</div>

			<div className="divide-y divide-border bg-surface">
				{bills.map((bill) => (
					<BillRow
						key={bill.id}
						bill={bill}
						status={getBillStatus(bill, payments, month)}
						onEdit={onEdit}
						onDuplicate={onDuplicate}
						onDelete={onDelete}
						onPay={onPay}
					/>
				))}
			</div>
		</section>
	);
}

// ── Next Month Card ────────────────────────────────────────────────────────────

function NextMonthCard({
	bills,
	label,
	onAdd,
}: {
	bills: Bill[];
	label: string;
	onAdd: () => void;
}) {
	const total = bills.reduce((s, b) => s + parseInt(b.amount, 10), 0);

	return (
		<div className="overflow-hidden rounded-xl border border-dashed border-border/70 bg-muted/30">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-dashed border-border/70 bg-muted/50 px-4 py-3.5">
				<div className="flex items-center gap-2">
					<span className="flex size-7 items-center justify-center rounded-md bg-muted">
						<CalendarDays
							className="size-3.5 text-muted-foreground"
							strokeWidth={1.75}
						/>
					</span>
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
							Bulan Depan
						</p>
						<h3 className="text-[14px] font-semibold tracking-tight opacity-80">
							{label}
						</h3>
					</div>
				</div>
				{bills.length > 0 && (
					<p className="text-[12px] font-bold tabular-nums text-muted-foreground">
						{formatMoney(total)}
					</p>
				)}
			</div>

			{/* Body */}
			{bills.length === 0 ? (
				<div className="flex flex-col items-center px-4 py-8 text-center">
					<p className="text-sm font-semibold text-muted-foreground">
						Belum ada tagihan
					</p>
					<p className="mt-1 max-w-[180px] text-[12px] text-muted-foreground/70">
						Belum ada tagihan terdaftar untuk {label}.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-3 gap-1.5 border-dashed"
						onClick={onAdd}
					>
						<Plus className="size-3.5" strokeWidth={2.5} />
						Tambah
					</Button>
				</div>
			) : (
				<ul className="divide-y divide-border/50">
					{bills.map((bill) => (
						<li key={bill.id} className="flex items-center gap-3 px-4 py-3">
							{/* Colored left dot instead of avatar */}
							<span
								className="size-2 shrink-0 rounded-full opacity-70"
								style={{ backgroundColor: getBillColor(bill.name) }}
							/>
							<div className="min-w-0 flex-1">
								<p className="truncate text-[13px] font-medium opacity-80">
									{bill.name}
								</p>
								<p className="text-[11px] text-muted-foreground">
									{formatDueDateShort(bill.due_date)}
								</p>
							</div>
							<p className="shrink-0 text-[12.5px] font-semibold tabular-nums text-muted-foreground">
								{formatMoney(parseInt(bill.amount, 10))}
							</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ── Bill Form Dialog ───────────────────────────────────────────────────────────

function BillFormDialog({
	open,
	onClose,
	bill,
	onSaved,
}: {
	open: boolean;
	onClose: () => void;
	bill?: Bill;
	onSaved: () => void;
}) {
	const { categories } = useCategories();
	const { trigger: createBill, isMutating: creating } = useCreateBill();
	const { trigger: updateBill, isMutating: updating } = useUpdateBill();

	const [name, setName] = useState(bill?.name ?? '');
	const [amount, setAmount] = useState(bill ? parseInt(bill.amount, 10) : 0);
	const [dueDate, setDueDate] = useState(
		bill?.due_date ?? format(new Date(), 'yyyy-MM-dd'),
	);
	const [categoryId, setCategoryId] = useState(bill?.category_id ?? '');
	const [notes, setNotes] = useState(bill?.notes ?? '');

	const saving = creating || updating;
	const expenseCategories = categories.filter(
		(c) => c.type === 'expense' && !c.parent_id && !c.deleted_at,
	);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!name.trim()) return;

		const data: CreateBillInput = {
			name: name.trim(),
			amount,
			due_date: dueDate,
			recurrence: 'none',
			account_id: '',
			category_id: categoryId,
			notes,
		};

		try {
			const res = bill?.id
				? await updateBill({ id: bill.id, data })
				: await createBill(data);

			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success(bill?.id ? 'Tagihan diperbarui' : 'Tagihan ditambahkan');
			onSaved();
			onClose();
		} catch {
			toast.error('Gagal menyimpan tagihan');
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>{bill?.id ? 'Edit Tagihan' : 'Tambah Tagihan'}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 pt-1">
					{/* Name */}
					<div className="space-y-1.5">
						<Label htmlFor="bill-name">Nama Tagihan</Label>
						<Input
							id="bill-name"
							placeholder="contoh: Listrik PLN, WiFi, Netflix"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
					</div>

					{/* Amount */}
					<div className="space-y-1.5">
						<Label>Jumlah</Label>
						<MoneyInput value={amount} onChange={(v) => setAmount(v ?? 0)} />
					</div>

					{/* Due Date + Category */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="bill-due">Jatuh Tempo</Label>
							<Input
								id="bill-due"
								type="date"
								value={dueDate}
								onChange={(e) => setDueDate(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-1.5">
							<Label>Kategori (opsional)</Label>
							<Select
								value={categoryId || '__none__'}
								onValueChange={(v) => setCategoryId(v === '__none__' ? '' : v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih kategori..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none__">— Tanpa kategori</SelectItem>
									{expenseCategories.map((cat) => (
										<SelectItem key={cat.id} value={cat.id}>
											{cat.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Notes */}
					<div className="space-y-1.5">
						<Label htmlFor="bill-notes">Catatan (opsional)</Label>
						<Textarea
							id="bill-notes"
							placeholder="Nomor pelanggan, info tambahan..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={2}
						/>
					</div>

					<div className="flex justify-end gap-3 pt-1">
						<Button type="button" variant="outline" onClick={onClose}>
							Batal
						</Button>
						<Button
							type="submit"
							variant="accent"
							disabled={saving || !name.trim()}
						>
							{saving ? 'Menyimpan…' : 'Simpan'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ── Pay Bill Dialog ────────────────────────────────────────────────────────────

function PayBillDialog({
	open,
	onClose,
	bill,
	onPaid,
}: {
	open: boolean;
	onClose: () => void;
	bill: Bill | null;
	onPaid: () => void;
}) {
	const { trigger: payBill, isMutating: paying } = usePayBill();

	const [amount, setAmount] = useState(() =>
		bill ? parseInt(bill.amount, 10) : 0,
	);
	const [paidDate, setPaidDate] = useState(() =>
		format(new Date(), 'yyyy-MM-dd'),
	);
	const [notes, setNotes] = useState('');

	if (!bill) return null;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!bill || amount <= 0) return;

		try {
			const res = await payBill({
				id: bill.id,
				amount,
				paid_at: `${paidDate}T00:00:00.000Z`,
				notes,
			});
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success('Tagihan berhasil dibayar!');
			onPaid();
			onClose();
		} catch {
			toast.error('Gagal mencatat pembayaran');
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Bayar Tagihan</DialogTitle>
				</DialogHeader>

				<div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
					<span
						className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
						style={{ backgroundColor: getBillColor(bill.name) }}
					>
						{bill.name.charAt(0).toUpperCase()}
					</span>
					<div className="min-w-0">
						<p className="truncate font-medium">{bill.name}</p>
						<p className="text-xs text-muted-foreground">
							Jatuh tempo {formatDueDate(bill.due_date)}
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label>Jumlah Pembayaran</Label>
						<MoneyInput value={amount} onChange={(v) => setAmount(v ?? 0)} />
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="paid-date">Tanggal Bayar</Label>
						<Input
							id="paid-date"
							type="date"
							value={paidDate}
							onChange={(e) => setPaidDate(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="pay-notes">Catatan (opsional)</Label>
						<Input
							id="pay-notes"
							placeholder="contoh: via transfer BCA"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					<div className="flex justify-end gap-3 pt-1">
						<Button type="button" variant="outline" onClick={onClose}>
							Batal
						</Button>
						<Button
							type="submit"
							variant="accent"
							disabled={paying || amount <= 0}
						>
							{paying ? 'Memproses…' : 'Konfirmasi Bayar'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────────

function DeleteBillDialog({
	open,
	onClose,
	bill,
	onDeleted,
}: {
	open: boolean;
	onClose: () => void;
	bill: Bill | null;
	onDeleted: () => void;
}) {
	const { trigger: deleteBill, isMutating: deleting } = useDeleteBill();

	if (!bill) return null;

	async function handleDelete() {
		if (!bill) return;
		try {
			const res = await deleteBill(bill.id);
			if (!res.ok) {
				toast.error(res.error);
				return;
			}
			toast.success('Tagihan dihapus');
			onDeleted();
			onClose();
		} catch {
			toast.error('Gagal menghapus tagihan');
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Hapus Tagihan</DialogTitle>
				</DialogHeader>
				<p className="text-sm text-muted-foreground">
					Hapus{' '}
					<span className="font-semibold text-foreground">{bill.name}</span>?
					Riwayat pembayaran tidak akan ikut terhapus.
				</p>
				<div className="flex justify-end gap-3 pt-2">
					<Button variant="outline" onClick={onClose}>
						Batal
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={deleting}
					>
						{deleting ? 'Menghapus…' : 'Hapus'}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const STATUS_ORDER: BillStatus[] = ['overdue', 'due-soon', 'unpaid', 'paid'];

export default function BillsPage() {
	const [month, setMonth] = useState(currentYM);
	const [formOpen, setFormOpen] = useState(false);
	const [editBill, setEditBill] = useState<Bill | undefined>(undefined);
	const [payBill, setPayBill] = useState<Bill | null>(null);
	const [deleteBill, setDeleteBill] = useState<Bill | null>(null);

	const nextMonth = nextMonthYM(month);
	const nextLabel = monthFullLabel(nextMonth);

	const {
		bills,
		isLoading: billsLoading,
		error: billsError,
		mutate: mutateBills,
	} = useBills();
	const {
		payments,
		isLoading: paymentsLoading,
		mutate: mutatePayments,
	} = useBillPayments(month);

	const isLoading = billsLoading || paymentsLoading;

	function openAdd() {
		setEditBill(undefined);
		setFormOpen(true);
	}

	function openEdit(bill: Bill) {
		setEditBill(bill);
		setFormOpen(true);
	}

	function openDuplicate(bill: Bill) {
		setEditBill({ ...bill, id: '' });
		setFormOpen(true);
	}

	function handleSaved() {
		mutateBills();
		mutatePayments();
	}

	function handlePaid() {
		mutateBills();
		mutatePayments();
	}

	function handleDeleted() {
		mutateBills();
	}

	// Bills for selected month only (filter by due_date month)
	const filteredBills = useMemo(
		() => bills.filter((b) => !b.deleted_at && b.due_date.startsWith(month)),
		[bills, month],
	);

	// Bills for next month (preview panel)
	const nextMonthBills = useMemo(
		() =>
			bills
				.filter((b) => !b.deleted_at && b.due_date.startsWith(nextMonth))
				.sort((a, b) => a.due_date.localeCompare(b.due_date)),
		[bills, nextMonth],
	);

	// Group selected-month bills by status
	const grouped = useMemo(() => {
		const groups: Record<BillStatus, Bill[]> = {
			overdue: [],
			'due-soon': [],
			unpaid: [],
			paid: [],
		};
		for (const bill of filteredBills) {
			groups[getBillStatus(bill, payments, month)].push(bill);
		}
		return groups;
	}, [filteredBills, payments, month]);

	// Summary stats for selected month
	const stats = useMemo(() => {
		const paidAmount = grouped.paid.reduce(
			(s, b) => s + parseInt(b.amount, 10),
			0,
		);
		const overdueAmount = grouped.overdue.reduce(
			(s, b) => s + parseInt(b.amount, 10),
			0,
		);
		const unpaidAmount = [...grouped.unpaid, ...grouped['due-soon']].reduce(
			(s, b) => s + parseInt(b.amount, 10),
			0,
		);
		const allAmount = filteredBills.reduce(
			(s, b) => s + parseInt(b.amount, 10),
			0,
		);
		return {
			total: { count: filteredBills.length, amount: allAmount },
			paid: { count: grouped.paid.length, amount: paidAmount },
			unpaid: {
				count: grouped.unpaid.length + grouped['due-soon'].length,
				amount: unpaidAmount,
			},
			overdue: { count: grouped.overdue.length, amount: overdueAmount },
		};
	}, [filteredBills, grouped]);

	const hasAnyBills = bills.length > 0;

	return (
		<PageContainer bleed>
			{/* Header */}
			<header className="flex items-end justify-between gap-3 px-5 py-4 lg:px-0 lg:py-0 lg:pb-6">
				<div className="min-w-0">
					<MobileBackButton />
					<h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight lg:text-[28px]">
						Tagihan
					</h1>
					<p className="mt-0.5 hidden text-[13px] text-muted-foreground lg:block">
						Listrik, sewa, langganan, dan tagihan rutin keluarga.
					</p>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<MonthPicker value={month} onChange={setMonth} />
					<Button
						variant="accent"
						onClick={openAdd}
						className="hidden lg:inline-flex"
					>
						<Plus className="size-4" strokeWidth={2.5} aria-hidden="true" />
						Tambah Tagihan
					</Button>
				</div>
			</header>

			{/* Mobile add button */}
			<div className="mb-3 flex justify-end px-5 lg:hidden">
				<Button variant="accent" size="sm" onClick={openAdd} className="gap-1.5">
					<Plus className="size-4" strokeWidth={2.5} />
					Tambah Tagihan
				</Button>
			</div>

			{/* Loading */}
			{isLoading && (
				<div className="px-5 lg:px-0">
					{/* 4 summary cards */}
					<div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-24 rounded-xl" />
						))}
					</div>
					{/* 2-col: bills list | next month */}
					<div className="gap-5 lg:flex lg:items-start">
						{/* Left: bills list */}
						<div className="flex-1 overflow-hidden rounded-xl border border-border">
							<div className="flex items-center gap-2 border-b border-border px-5 py-3">
								<Skeleton className="size-3.5 rounded" />
								<Skeleton className="h-3.5 w-20 rounded" />
							</div>
							{[0, 1, 2].map((i) => (
								<div key={i} className="flex items-center gap-3 border-b border-border px-5 py-3.5">
									<Skeleton className="size-10 shrink-0 rounded-full" />
									<div className="flex-1 space-y-1.5">
										<Skeleton className="h-3.5 w-32 rounded" />
										<Skeleton className="h-3 w-24 rounded" />
									</div>
									<div className="flex flex-col items-end gap-1.5">
										<Skeleton className="h-4 w-20 rounded" />
										<Skeleton className="h-5 w-16 rounded-full" />
									</div>
								</div>
							))}
							<div className="flex items-center gap-2 border-b border-border px-5 py-3">
								<Skeleton className="size-3.5 rounded" />
								<Skeleton className="h-3.5 w-24 rounded" />
							</div>
							{[0, 1].map((i) => (
								<div key={i} className="flex items-center gap-3 border-b border-border px-5 py-3.5">
									<Skeleton className="size-10 shrink-0 rounded-full" />
									<div className="flex-1 space-y-1.5">
										<Skeleton className="h-3.5 w-28 rounded" />
										<Skeleton className="h-3 w-20 rounded" />
									</div>
									<div className="flex flex-col items-end gap-1.5">
										<Skeleton className="h-4 w-16 rounded" />
										<Skeleton className="h-5 w-14 rounded-full" />
									</div>
								</div>
							))}
						</div>
						{/* Right: next month card */}
						<div className="mt-4 lg:mt-0 lg:w-[280px] lg:shrink-0">
							<Skeleton className="h-48 rounded-xl" />
						</div>
					</div>
				</div>
			)}

			{/* Error */}
			{!isLoading && billsError && (
				<ErrorState message={billsError} onRetry={() => mutateBills()} />
			)}

			{/* No bills at all: full-page empty state */}
			{!isLoading && !billsError && !hasAnyBills && (
				<EmptyState
					icon={FileText}
					title="Belum ada tagihan"
					description="Tambahkan tagihan rutin seperti listrik, WiFi, atau sewa."
					action={
						<Button variant="accent" onClick={openAdd}>
							<Plus className="size-4" />
							Tambah Tagihan
						</Button>
					}
				/>
			)}

			{/* Content */}
			{!isLoading && !billsError && hasAnyBills && (
				<div className="px-5 lg:px-0">
					{/* Two-column layout: current (left) + next month (right) */}
					<div className="gap-5 lg:flex lg:items-start">
						{/* Left: summary cards + bills list */}
						<div className="flex-1 space-y-4">
							{/* Summary cards */}
							<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
								<SummaryCard
									label="TOTAL TAGIHAN"
									count={stats.total.count}
									amount={stats.total.amount}
								/>
								<SummaryCard
									label="SUDAH LUNAS"
									count={stats.paid.count}
									amount={stats.paid.amount}
									accent="#10b981"
								/>
								<SummaryCard
									label="BELUM BAYAR"
									count={stats.unpaid.count}
									amount={stats.unpaid.amount}
									accent="#6b7280"
								/>
								<SummaryCard
									label="TERLAMBAT"
									count={stats.overdue.count}
									amount={stats.overdue.amount}
									accent="#ef4444"
								/>
							</div>

							{/* Bills list for selected month */}
							<div className="overflow-hidden rounded-xl border border-border bg-surface">
								{filteredBills.length === 0 ? (
									<div className="flex flex-col items-center px-4 py-12 text-center">
										<span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-muted">
											<FileText
												className="size-6 text-muted-foreground"
												strokeWidth={1.5}
											/>
										</span>
										<p className="font-semibold">
											Tidak ada tagihan di {monthFullLabel(month)}
										</p>
										<p className="mt-1 max-w-[240px] text-[12.5px] text-muted-foreground">
											Belum ada tagihan yang jatuh tempo pada bulan ini.
										</p>
										<Button
											variant="outline"
											size="sm"
											className="mt-4 gap-1.5"
											onClick={openAdd}
										>
											<Plus className="size-3.5" strokeWidth={2.5} />
											Tambah Tagihan Bulan Ini
										</Button>
									</div>
								) : (
									<>
										{STATUS_ORDER.map((status, idx) => (
											<div
												key={status}
												className={cn(
													idx > 0 &&
														grouped[status].length > 0 &&
														'border-t border-border',
												)}
											>
												<BillGroupSection
													status={status}
													bills={grouped[status]}
													payments={payments}
													month={month}
													onEdit={openEdit}
													onDuplicate={openDuplicate}
													onDelete={(b) => setDeleteBill(b)}
													onPay={(b) => setPayBill(b)}
												/>
											</div>
										))}
									</>
								)}
							</div>
						</div>

						{/* Right: next month preview */}
						<div className="mt-4 lg:mt-0 lg:w-[280px] lg:shrink-0">
							<NextMonthCard
								bills={nextMonthBills}
								label={nextLabel}
								onAdd={openAdd}
							/>
						</div>
					</div>
				</div>
			)}

			{/* Dialogs */}
			<BillFormDialog
				key={editBill?.id ?? 'new'}
				open={formOpen}
				onClose={() => setFormOpen(false)}
				bill={editBill}
				onSaved={handleSaved}
			/>

			<PayBillDialog
				open={!!payBill}
				onClose={() => setPayBill(null)}
				bill={payBill}
				onPaid={handlePaid}
			/>

			<DeleteBillDialog
				open={!!deleteBill}
				onClose={() => setDeleteBill(null)}
				bill={deleteBill}
				onDeleted={handleDeleted}
			/>
		</PageContainer>
	);
}
