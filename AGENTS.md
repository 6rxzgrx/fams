<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# FAMS — Agent Rules

**Last updated:** 2026-05-16

## Sitemap (source of truth)

Routes are grouped by domain. Match these exactly when adding pages.

```
/home                              Beranda FAMS (cross-module summary)
/finance                           Redirect ke /finance/dashboard
/finance/dashboard                 Ringkasan keuangan
/finance/transactions              Pemasukan / pengeluaran / transfer
/finance/anggaran                  Anggaran bulanan per kategori
/finance/aset                      Gabungan akun + aset (entrypoint yang dipakai UI saat ini)
/finance/accounts                  Bank, kas, e-wallet, pinjaman
/finance/assets                    Properti, kendaraan, emas, elektronik
/finance/bills                     Tagihan berulang + riwayat pembayaran
/finance/reports                   Ringkasan bulanan, arus kas (v1.2)
/calendar                          Tampilan kalender
/calendar/events                   Acara keluarga
/calendar/reminders                Pengingat satu kali & berulang
/other                             Overview modul non-finance
/other/maintenance                 Servis AC, kendaraan, peralatan
/other/vault                       Brankas dokumen (KTP, paspor, asuransi)
/other/notes                       Catatan rumah, password, perjanjian
/settings                          Hub pengaturan
/settings/members                  Anggota & peran
/settings/notifications            Preferensi notifikasi
/settings/integrations             Google OAuth, Drive, Calendar, Gemini
/settings/audit-log                Riwayat aktivitas
/notifications                     Feed gabungan (mobile bottom nav target)
/scan                              Pindai struk via kamera + Gemini
```

**Rules:**
- New finance-related pages → `/finance/*`.
- New calendar/event/reminder pages → `/calendar/*`.
- Non-finance utility modules → `/other/*`.
- App root `/` redirects to `/home`. Sign-in redirects to `/home`.
- Do NOT re-introduce flat top-level routes (`/transactions`, `/bills`, etc.) — those have been migrated.

## Navigation shells

Two distinct shells switch at `lg` (1024px). Wired in [src/app/(app)/layout.tsx](src/app/(app)/layout.tsx).

| Viewport | Shell | File |
|----------|-------|------|
| `≥ lg` | Fixed **left sidebar** with grouped sections | [app-sidebar.tsx](src/components/app-sidebar.tsx) |
| `< lg` | Floating **5-item bottom pill** with center FAB | [bottom-nav.tsx](src/components/nav/bottom-nav.tsx) |

The sidebar groups (Beranda → Keuangan → Kalender → Lainnya → Pengaturan) mirror the sitemap exactly. When adding a new route, add the link to the matching group in `app-sidebar.tsx`.

Mobile bottom nav items are fixed: **Beranda, Keuangan, FAB (center), Notifikasi, Pengaturan**. The center FAB opens the [add-sheet.tsx](src/components/nav/add-sheet.tsx) with quick actions (catat pengeluaran/pemasukan/transfer/pindai struk). Do not add or remove items from the mobile bar — the sitemap's other modules are reached via Beranda on mobile or the sidebar on desktop.

Main content shell: desktop spacing is handled by `SidebarInset` in the app layout, while `<main>` currently uses `pb-nav pt-safe lg:pb-10 lg:pt-0`. Pages should override mobile's `max-w-md` with `lg:mx-0 lg:max-w-none` (or `lg:max-w-[1200px]` for reading-width pages).

## Skeleton pages

Pages that exist but are not yet implemented use [page-skeleton.tsx](src/components/sections/page-skeleton.tsx). Status pill values: `ready` | `soon` | `planned`. When implementing a skeleton page, replace its body but keep the route in place.

## Conventions (recap, see [CLAUDE.md](CLAUDE.md) for full rules)

- TypeScript strict. Zod at API boundaries. ULIDs for IDs. Soft delete only.
- All Google/AI calls server-side. No secrets in client.
- Audit every write via `writeAudit()`.
- Default locale `id-ID`. Money via `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.
- UI tokens only — no hardcoded hex/spacing. Lucide icons. No emoji as functional icons.
- Touch targets ≥ 44×44pt. Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Before you ship a UI change

1. Verify the design system: [design-system/fams/MASTER.md](design-system/fams/MASTER.md).
2. Check both shells: 375px mobile + 1280px desktop.
3. Verify both color modes.
4. Run `npm run lint` and `npm run typecheck` before commit.
