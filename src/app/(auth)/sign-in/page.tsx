import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { SignInButton } from './sign-in-button';

export const metadata: Metadata = { title: 'Masuk · FAMS' };

function SparklesIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={24}
			height={24}
			fill="none"
			stroke="#0A0A0B"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="m12 3-1.9 5.4L4.7 10.3l5.4 1.9L12 17.6l1.9-5.4 5.4-1.9-5.4-1.9z" />
			<path d="M5 3v4" />
			<path d="M19 17v4" />
			<path d="M3 5h4" />
			<path d="M17 19h4" />
		</svg>
	);
}

function WalletIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={12}
			height={12}
			fill="none"
			stroke="#0A0A0B"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M19 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
			<path d="M16 14h2" />
			<path d="M5 7V5a2 2 0 0 1 2-2h9v4" />
		</svg>
	);
}

function CakeIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={12}
			height={12}
			fill="none"
			stroke="#FBBF24"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M20 21H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
			<path d="M4 16h16" />
			<path d="M12 12V8" />
			<path d="M8 12V9" />
			<path d="M16 12V9" />
			<path d="M12 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
		</svg>
	);
}

function WrenchIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={14}
			height={14}
			fill="none"
			stroke="#93C5FD"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-2-2 8-8-1.7-1.7z" />
			<path d="m9 15-5 5" />
		</svg>
	);
}

function BellIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={12}
			height={12}
			fill="none"
			stroke="#FB7185"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
			<path d="M10 21a2 2 0 0 0 4 0" />
		</svg>
	);
}

function VaultIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={12}
			height={12}
			fill="none"
			stroke="#A3A3FF"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<rect x="3" y="4" width="18" height="16" rx="2" />
			<circle cx="13" cy="12" r="3" />
			<path d="M13 9v-1" />
			<path d="M13 15v1" />
			<path d="M16 12h1" />
		</svg>
	);
}

function LockIcon() {
	return (
		<svg
			viewBox="0 0 24 24"
			width={13}
			height={13}
			fill="none"
			stroke="#8E8E93"
			strokeWidth="1.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<rect x="4" y="11" width="16" height="10" rx="2" />
			<path d="M8 11V7a4 4 0 0 1 8 0v4" />
		</svg>
	);
}

function Logo() {
	return (
		<div className="flex flex-col items-center gap-2.5">
			<div
				className="flex h-12 w-12 items-center justify-center"
				style={{
					borderRadius: 13,
					background:
						'linear-gradient(135deg, #D7FF6B 0%, #C5F23E 55%, #A3E635 100%)',
					boxShadow:
						'0 12px 32px rgba(197,242,62,0.35), inset 0 1px 0 rgba(255,255,255,0.5)',
				}}
			>
				<SparklesIcon />
			</div>
			<div className="flex items-baseline gap-2">
				<span
					style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em' }}
				>
					FAMS
				</span>
				<span style={{ fontSize: 11, fontWeight: 500, color: '#8E8E93' }}>
					Family Super App
				</span>
			</div>
		</div>
	);
}

function CardStack() {
	return (
		// Fixed 342px width, always centered — keeps rotated cards pixel-perfect
		// regardless of viewport width.
		<div className="relative h-[260px] w-[342px] shrink-0">
			{/* Keuangan — hero lime */}
			<div
				className="absolute"
				style={{
					top: 20,
					left: 14,
					width: 218,
					transform: 'rotate(-4deg)',
					background: '#C5F23E',
					color: '#0A0A0B',
					borderRadius: 16,
					padding: '10px 12px',
					boxShadow: '0 18px 36px rgba(0,0,0,0.5)',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						fontSize: 10,
						fontWeight: 600,
						letterSpacing: '0.05em',
						opacity: 0.7,
					}}
				>
					<WalletIcon /> KEUANGAN
				</div>
				<div
					style={{
						fontSize: 22,
						fontWeight: 700,
						fontVariantNumeric: 'tabular-nums',
						letterSpacing: '-0.02em',
						marginTop: 4,
					}}
				>
					Rp 12,4 jt
				</div>
				<div style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>
					Saldo gabungan · Mei
				</div>
			</div>

			{/* Kalender */}
			<div
				className="absolute"
				style={{
					top: 0,
					right: 8,
					width: 178,
					transform: 'rotate(5deg)',
					background: '#1C1C1E',
					border: '1px solid rgba(255,255,255,0.08)',
					borderRadius: 16,
					padding: '10px 12px',
					boxShadow: '0 18px 36px rgba(0,0,0,0.5)',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						fontSize: 10,
						fontWeight: 600,
						color: '#FBBF24',
						letterSpacing: '0.05em',
					}}
				>
					<CakeIcon /> KALENDER
				</div>
				<div
					style={{
						fontSize: 13,
						fontWeight: 600,
						marginTop: 4,
						letterSpacing: '-0.01em',
					}}
				>
					Ulang tahun Opa
				</div>
				<div
					style={{
						fontSize: 10.5,
						color: '#8E8E93',
						fontWeight: 500,
						marginTop: 2,
					}}
				>
					Sabtu, 18 Mei
				</div>
			</div>

			{/* Perawatan */}
			<div
				className="absolute"
				style={{
					top: 118,
					left: 34,
					width: 204,
					transform: 'rotate(-2deg)',
					background: '#1C1C1E',
					border: '1px solid rgba(255,255,255,0.08)',
					borderRadius: 16,
					padding: '10px 12px',
					boxShadow: '0 18px 36px rgba(0,0,0,0.5)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
					<div
						style={{
							width: 28,
							height: 28,
							borderRadius: 9,
							background: 'rgba(147,197,253,0.14)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							flexShrink: 0,
						}}
					>
						<WrenchIcon />
					</div>
					<div>
						<div style={{ fontSize: 12, fontWeight: 600 }}>Servis AC</div>
						<div style={{ fontSize: 10, color: '#8E8E93', fontWeight: 500 }}>
							Perawatan · 3 hari lagi
						</div>
					</div>
				</div>
			</div>

			{/* Pengingat */}
			<div
				className="absolute"
				style={{
					top: 104,
					right: 18,
					width: 158,
					transform: 'rotate(4deg)',
					background: '#1C1C1E',
					border: '1px solid rgba(255,255,255,0.08)',
					borderRadius: 16,
					padding: '10px 12px',
					boxShadow: '0 18px 36px rgba(0,0,0,0.5)',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						fontSize: 10,
						fontWeight: 600,
						color: '#FB7185',
						letterSpacing: '0.05em',
					}}
				>
					<BellIcon /> PENGINGAT
				</div>
				<div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
					PLN Mei
				</div>
				<div
					style={{
						fontSize: 13,
						fontWeight: 700,
						fontVariantNumeric: 'tabular-nums',
						marginTop: 1,
					}}
				>
					Rp 487k
				</div>
			</div>

			{/* Brankas */}
			<div
				className="absolute"
				style={{
					top: 198,
					left: 60,
					width: 188,
					transform: 'rotate(2deg)',
					background: '#1C1C1E',
					border: '1px solid rgba(255,255,255,0.08)',
					borderRadius: 16,
					padding: '10px 12px',
					boxShadow: '0 18px 36px rgba(0,0,0,0.5)',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						fontSize: 10,
						fontWeight: 600,
						color: '#A3A3FF',
						letterSpacing: '0.05em',
					}}
				>
					<VaultIcon /> BRANKAS
				</div>
				<div style={{ fontSize: 12, fontWeight: 600, marginTop: 4 }}>
					STNK Avanza
				</div>
				<div
					style={{
						fontSize: 10,
						color: '#8E8E93',
						fontWeight: 500,
						marginTop: 1,
					}}
				>
					Berlaku Mar 2027
				</div>
			</div>
		</div>
	);
}

export default async function SignInPage() {
	const session = await auth();
	if (session) redirect('/home');

	return (
		<div
			className="relative min-h-screen overflow-hidden"
			style={{
				background: '#0A0A0B',
				color: '#FAFAFA',
				fontFamily: '"Geist", "Geist Sans", -apple-system, sans-serif',
			}}
		>
			{/* ── Ambient glows (fixed so they don't move with content) ── */}
			<div
				className="pointer-events-none fixed"
				style={{
					top: '10%',
					right: '-5%',
					width: 400,
					height: 400,
					borderRadius: '50%',
					background:
						'radial-gradient(circle, rgba(197,242,62,0.13) 0%, transparent 70%)',
				}}
			/>
			<div
				className="pointer-events-none fixed"
				style={{
					bottom: '5%',
					left: '-5%',
					width: 320,
					height: 320,
					borderRadius: '50%',
					background:
						'radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%)',
				}}
			/>

			{/* ── Mobile layout: single column ─────────────────────────── */}
			{/* ── Desktop layout: two columns (visual | form) ─────────── */}
			<div className="flex min-h-screen flex-col md:flex-row">
				{/* ── LEFT / TOP: visual panel ── */}
				<div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 pt-14 pb-4 md:gap-10 md:py-16">
					<CardStack />
				</div>

				{/* ── RIGHT / BOTTOM: form panel ── */}
				<div
					className="flex shrink-0 flex-col items-center justify-center gap-0 px-6 pb-12 pt-2 md:w-[420px] md:border-l md:py-16 md:px-12"
					style={{ borderColor: 'rgba(255,255,255,0.08)' }}
				>
					{/* Header */}
					<div className="w-full text-center md:text-left">
						<h1
							style={{
								fontSize: 'clamp(22px, 5vw, 28px)',
								fontWeight: 700,
								letterSpacing: '-0.025em',
								lineHeight: 1.15,
								margin: 0,
							}}
						>
							Rumah tangga,
							<br />
							dalam satu app.
						</h1>
					</div>

					{/* Subheader */}
					<div
						className="mt-3 w-full text-center md:text-left"
						style={{
							fontSize: 14,
							fontWeight: 500,
							color: '#8E8E93',
							lineHeight: 1.55,
						}}
					>
						Bukan cuma uang. Jadwal, perawatan, dokumen — semua di sini.
					</div>

					{/* Sign-in button */}
					<div className="mt-8 w-full">
						<SignInButton />
					</div>

					{/* Footer hint */}
					<div
						className="mt-4 flex items-center justify-center gap-1.5"
						style={{ fontSize: 11.5, fontWeight: 500, color: '#8E8E93' }}
					>
						<LockIcon />
						Privat untuk keluarga Anda. Hanya yang diundang.
					</div>
				</div>
			</div>
		</div>
	);
}
