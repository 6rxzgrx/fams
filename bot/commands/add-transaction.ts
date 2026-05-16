import type { Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { accountsRepo } from '@/integrations/sheets/repositories/accounts';
import { transactionsRepo } from '@/integrations/sheets/repositories/transactions';
import { generateId } from '@/lib/ulid';
import { writeAudit } from '@/lib/audit';
import { formatMoney } from '@/lib/money';
import { getDraft, setDraft, clearDraft } from '../state';
import type { TxType } from '../state';

const TAG = '[bot/catat]';

const TYPE_LABELS: Record<TxType, string> = {
	expense: 'Pengeluaran',
	income: 'Pemasukan',
	transfer: 'Transfer',
};

// ─── /catat command ───────────────────────────────────────────────────────────

export async function addTransactionCommand(ctx: Context) {
	const chatId = ctx.chat?.id;
	const userId = ctx.from?.id;
	console.log(`${TAG} /catat started chatId=${chatId} userId=${userId}`);
	if (!chatId || !userId) return;

	clearDraft(chatId);
	setDraft(chatId, { step: 'type', userId });

	const kb = new InlineKeyboard()
		.text('Pengeluaran', 'tx:type:expense')
		.text('Pemasukan', 'tx:type:income')
		.text('Transfer', 'tx:type:transfer')
		.row()
		.text('Batal', 'tx:cancel');

	await ctx.reply('*Tambah Transaksi*\n\nJenis transaksi:', {
		parse_mode: 'Markdown',
		reply_markup: kb,
	});
}

// ─── Inline keyboard callbacks ────────────────────────────────────────────────

export async function handleTxCallback(ctx: Context) {
	const data = ctx.callbackQuery?.data;
	const chatId = ctx.chat?.id ?? ctx.callbackQuery?.message?.chat.id;
	const userId = ctx.from?.id;
	console.log(`${TAG} callback data="${data}" chatId=${chatId} userId=${userId}`);

	if (!data || !chatId || !userId) return;

	await ctx.answerCallbackQuery();

	if (data === 'tx:cancel') {
		clearDraft(chatId);
		return ctx.editMessageText('Dibatalkan.');
	}

	const draft = getDraft(chatId);
	console.log(`${TAG} draft at callback:`, JSON.stringify(draft));

	if (!draft) {
		return ctx.editMessageText('Sesi berakhir. Ketik /catat untuk memulai lagi.');
	}

	// Step 1 → type selected → show account picker
	if (data.startsWith('tx:type:')) {
		const type = data.replace('tx:type:', '') as TxType;
		setDraft(chatId, { type, step: 'account', userId });

		const accounts = await accountsRepo.findAll();
		const active = accounts.filter((a) => !a.deleted_at);
		if (active.length === 0) {
			clearDraft(chatId);
			return ctx.editMessageText(
				'Belum ada akun. Tambahkan akun di aplikasi FAMS terlebih dahulu.',
			);
		}

		const kb = new InlineKeyboard();
		for (const acc of active) {
			kb.text(acc.name, `tx:account:${acc.id}`).row();
		}
		kb.text('Batal', 'tx:cancel');

		const label = type === 'transfer' ? 'Pilih akun sumber:' : 'Pilih akun:';
		return ctx.editMessageText(`*${TYPE_LABELS[type]}*\n\n${label}`, {
			parse_mode: 'Markdown',
			reply_markup: kb,
		});
	}

	// Step 2 → source account selected
	if (data.startsWith('tx:account:') && draft.step === 'account') {
		const accountId = data.replace('tx:account:', '');
		const accounts = await accountsRepo.findAll();
		const account = accounts.find((a) => a.id === accountId);
		if (!account) return ctx.editMessageText('Akun tidak ditemukan.');

		setDraft(chatId, { account_id: accountId, account_name: account.name });

		// Transfer needs a destination account
		if (draft.type === 'transfer') {
			setDraft(chatId, { step: 'to_account' });
			const others = accounts.filter((a) => a.id !== accountId && !a.deleted_at);
			if (others.length === 0) {
				clearDraft(chatId);
				return ctx.editMessageText('Tidak ada akun tujuan lain yang tersedia.');
			}

			const kb = new InlineKeyboard();
			for (const acc of others) {
				kb.text(acc.name, `tx:toaccount:${acc.id}`).row();
			}
			kb.text('Batal', 'tx:cancel');

			return ctx.editMessageText('Pilih akun tujuan:', {
				parse_mode: 'Markdown',
				reply_markup: kb,
			});
		}

		// Expense/income → ask for amount
		setDraft(chatId, { step: 'amount' });
		await ctx.editMessageText(
			`*${TYPE_LABELS[draft.type!]}*\nAkun: ${account.name}`,
			{ parse_mode: 'Markdown' },
		);
		return ctx.reply('Masukkan jumlah:\n_Contoh: 50000, 50rb, 1.5jt_', {
			parse_mode: 'Markdown',
			reply_markup: { force_reply: true, selective: true },
		});
	}

	// Step 3 → destination account selected (transfer only)
	if (data.startsWith('tx:toaccount:') && draft.step === 'to_account') {
		const toAccountId = data.replace('tx:toaccount:', '');
		const accounts = await accountsRepo.findAll();
		const toAccount = accounts.find((a) => a.id === toAccountId);
		if (!toAccount) return ctx.editMessageText('Akun tidak ditemukan.');

		setDraft(chatId, {
			to_account_id: toAccountId,
			to_account_name: toAccount.name,
			step: 'amount',
		});

		await ctx.editMessageText(
			`*Transfer*\nDari: ${draft.account_name}\nKe: ${toAccount.name}`,
			{ parse_mode: 'Markdown' },
		);
		return ctx.reply('Masukkan jumlah:\n_Contoh: 50000, 50rb, 1.5jt_', {
			parse_mode: 'Markdown',
			reply_markup: { force_reply: true, selective: true },
		});
	}

	// Step 4 → save
	if (data === 'tx:save') {
		const d = getDraft(chatId);
		if (!d?.type || !d.amount || !d.account_id) {
			return ctx.editMessageText('Data tidak lengkap. Ketik /catat untuk mulai lagi.');
		}
		if (d.type === 'transfer' && !d.to_account_id) {
			return ctx.editMessageText('Data tidak lengkap. Ketik /catat untuk mulai lagi.');
		}

		try {
			const now = new Date().toISOString();
			const today = now.slice(0, 10);

			if (d.type === 'transfer') {
				// Debit source, credit destination — two linked transactions
				const idOut = generateId('transaction');
				const idIn = generateId('transaction');
				const description = `Transfer ke ${d.to_account_name}`;
				const descriptionIn = `Transfer dari ${d.account_name}`;

				await transactionsRepo.create({
					id: idOut,
					account_id: d.account_id,
					category_id: '',
					type: 'transfer',
					amount: String(d.amount),
					description,
					date: today,
					reference_no: idIn,
					notes: 'Via Telegram Bot',
					created_by: 'bot',
					created_at: now,
					updated_at: now,
					deleted_at: '',
				});
				await transactionsRepo.create({
					id: idIn,
					account_id: d.to_account_id!,
					category_id: '',
					type: 'transfer',
					amount: String(d.amount),
					description: descriptionIn,
					date: today,
					reference_no: idOut,
					notes: 'Via Telegram Bot',
					created_by: 'bot',
					created_at: now,
					updated_at: now,
					deleted_at: '',
				});

				await accountsRepo.applyBalanceDelta(d.account_id, -d.amount);
				await accountsRepo.applyBalanceDelta(d.to_account_id!, d.amount);

				await writeAudit({
					memberId: 'bot',
					memberName: 'FAMS Bot',
					action: 'create',
					entityType: 'transaction',
					entityId: idOut,
					after: { id: idOut },
				});
			} else {
				const id = generateId('transaction');
				const description =
					d.type === 'income'
						? `Pemasukan ke ${d.account_name}`
						: `Pengeluaran dari ${d.account_name}`;
				const delta = d.type === 'income' ? d.amount : -d.amount;

				await transactionsRepo.create({
					id,
					account_id: d.account_id,
					category_id: '',
					type: d.type,
					amount: String(d.amount),
					description,
					date: today,
					reference_no: '',
					notes: 'Via Telegram Bot',
					created_by: 'bot',
					created_at: now,
					updated_at: now,
					deleted_at: '',
				});
				await accountsRepo.applyBalanceDelta(d.account_id, delta);
				await writeAudit({
					memberId: 'bot',
					memberName: 'FAMS Bot',
					action: 'create',
					entityType: 'transaction',
					entityId: id,
					after: { id },
				});
			}

			clearDraft(chatId);

			const summary =
				d.type === 'transfer'
					? `${formatMoney(d.amount)}\n${d.account_name} → ${d.to_account_name}`
					: `${TYPE_LABELS[d.type]} ${formatMoney(d.amount)}\n${d.account_name}`;

			return ctx.editMessageText(`Tersimpan!\n\n${summary}`);
		} catch (err) {
			console.error(`${TAG} save error:`, err);
			return ctx.editMessageText('Gagal menyimpan. Coba lagi nanti.');
		}
	}
}

// ─── Text message handler ─────────────────────────────────────────────────────
// Returns true if the message was consumed by an active transaction flow.

export async function handleTxMessage(ctx: Context): Promise<boolean> {
	const chatId = ctx.chat?.id;
	const userId = ctx.from?.id;
	const text = ctx.message?.text;
	if (!chatId || !userId || !text || text.startsWith('/')) return false;

	const draft = getDraft(chatId);
	if (!draft) return false;

	if (draft.userId !== userId) return false;

	if (draft.step !== 'amount' && draft.step !== 'description') return false;

	try {
		// Waiting for amount
		if (draft.step === 'amount') {
			const amount = parseAmount(text);
			if (!amount || amount <= 0) {
				await ctx.reply('Jumlah tidak valid. Coba lagi:\n_Contoh: 50000, 50rb, 1.5jt_', {
					parse_mode: 'Markdown',
					reply_markup: { force_reply: true, selective: true },
				});
				return true;
			}
			setDraft(chatId, { amount, step: 'description' });
			await ctx.reply('Deskripsi singkat:', {
				reply_markup: { force_reply: true, selective: true },
			});
			return true;
		}

		// Waiting for description
		if (draft.step === 'description') {
			const description = text.trim().slice(0, 200);
			const d = setDraft(chatId, { description, step: 'confirm' });

			const kb = new InlineKeyboard().text('Simpan', 'tx:save').text('Batal', 'tx:cancel');

			let summary: string;
			if (d.type === 'transfer') {
				summary =
					`*Konfirmasi Transfer*\n\n` +
					`Dari: ${d.account_name}\n` +
					`Ke: ${d.to_account_name}\n` +
					`Jumlah: ${formatMoney(d.amount!)}\n` +
					`Deskripsi: ${description}`;
			} else {
				summary =
					`*Konfirmasi ${TYPE_LABELS[d.type!]}*\n\n` +
					`Akun: ${d.account_name}\n` +
					`Jumlah: ${formatMoney(d.amount!)}\n` +
					`Deskripsi: ${description}`;
			}

			await ctx.reply(summary, { parse_mode: 'Markdown', reply_markup: kb });
			return true;
		}
	} catch (err) {
		console.error(`${TAG} handleTxMessage error:`, err);
		clearDraft(chatId);
		await ctx.reply('Terjadi kesalahan. Ketik /catat untuk mulai lagi.');
		return true;
	}

	return false;
}

// ─── Amount parser ────────────────────────────────────────────────────────────

function parseAmount(input: string): number {
	const clean = input.toLowerCase().replace(/\s/g, '');
	const match = clean.match(/^([\d.]+)(rb|k|jt|m)?$/);
	if (!match) return 0;
	const base = parseFloat(match[1]);
	if (isNaN(base)) return 0;
	const suffix = match[2];
	if (suffix === 'rb' || suffix === 'k') return Math.round(base * 1_000);
	if (suffix === 'jt' || suffix === 'm') return Math.round(base * 1_000_000);
	return Math.round(base);
}
