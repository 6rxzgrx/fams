# FAMS — Project Brief
**Family Asset & Money System** · Family hub PWA · Responsive (web + mobile) · Google Sheets backend  
*Version 0.2.0 · 2026-05-16*

---

## The Ask

Build a private, responsive PWA where one family tracks money, assets, bills, reminders, schedules, household maintenance, and important documents. **Simple for non-technical members, clean architecture for future scaling.**

---

## Sitemap

```
FAMS
├── Beranda (Home)              cross-module summary
├── Keuangan (Finance)
│   ├── Dashboard               summary cards
│   ├── Transaksi               income / expense / transfer
│   ├── Akun                    bank, cash, e-wallet, loan
│   ├── Aset                    property, vehicle, gold, electronics
│   ├── Tagihan                 recurring + payment history
│   └── Laporan                 monthly summary, cash flow (v1.2)
├── Kalender (Calendar)
│   ├── Tampilan Kalender
│   ├── Acara                   family schedule
│   └── Pengingat               one-time + recurring
├── Lainnya (Other)
│   ├── Perawatan               AC, vehicle service, appliances
│   ├── Brankas Dokumen         IDs, passports, insurance, warranties
│   └── Catatan                 house rules, passwords, agreements
└── Pengaturan (Settings)
    ├── Anggota Keluarga        roles, permissions
    ├── Notifikasi              reminder preferences
    ├── Integrasi               Google OAuth, Drive, Calendar, Gemini
    └── Riwayat Aktivitas       who changed what
```

Plus shared routes: `/notifications` (mobile bottom-nav feed) and `/scan` (camera → Gemini).

## Modules

| Module | Purpose | Status |
|--------|---------|--------|
| **Beranda** | Cross-module summary: balance, due bills, today's reminders, recent activity | Skeleton |
| **Keuangan / Dashboard** | Net balance, monthly income/expense, upcoming bills, recent transactions | Ready |
| **Transaksi** | Income, expense, transfer; quick-add; AI-assisted capture | Ready |
| **Akun** | Bank, cash, e-wallet, loan; transfers; balance derived | Ready |
| **Aset** | Cash, vehicles, property, gold, electronics; grouped by type | Ready |
| **Tagihan** | Recurring bills, due dates, payment history; mark paid → auto-tx | Ready |
| **Laporan** | Monthly summaries, cash flow, category breakdown | Planned (v1.2) |
| **Kalender** | Month grid combining events + reminders + maintenance | Skeleton |
| **Acara** | Birthdays, holidays, family schedule; Google Calendar sync | Skeleton |
| **Pengingat** | One-time + recurring; notify before due date | Ready |
| **Perawatan** | Service intervals (AC, vehicles, appliances); auto-reminders | Skeleton |
| **Brankas Dokumen** | Document metadata + Drive references; expiry alerts | Planned |
| **Catatan** | House rules, contacts, agreements; group + access control | Skeleton |
| **Pindai Struk** | Camera → Gemini → editable draft → save tx/bill/both | Skeleton |
| **Notifikasi** | Combined feed: reminders + due bills + recent activity | Skeleton |
| **Pengaturan** | Members, notifications, integrations, audit log | Hub ready · subpages skeleton |

**MVP focus:** Finance modules end-to-end + Scan + Reminders + Settings basics. Other modules ship as skeletons (route + design) and fill in by v1.x.

---

## Navigation Shells

Two distinct shells switch at `lg` (1024px). See [design-system/fams/MASTER.md §11](design-system/fams/MASTER.md).

| Viewport | Shell | Behavior |
|----------|-------|----------|
| **Desktop (`≥ lg`)** | Fixed **left sidebar** (260px) | Brand top, grouped nav (Beranda → Keuangan → Kalender → Lainnya → Pengaturan), profile + sign-out at bottom. Main content offset `lg:pl-[260px]`. |
| **Mobile (`< lg`)** | Floating **5-item pill** at bottom | Beranda · Transaksi · **FAB (center, +)** · Notifikasi · Pengaturan |

**Center FAB** opens an action sheet with four quick actions: *Catat Pengeluaran*, *Catat Pemasukan*, *Transfer Antar Akun*, *Pindai Struk*. Reaches all other modules via Beranda on mobile or the sidebar on desktop — keeping the mobile bar to 5 items preserves clarity for older users.

---

## The Stack (No Surprises)

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 16 (App Router) | Vercel's free tier, API routes, cron support |
| **UI** | React 19 + Tailwind v4 + shadcn/ui | Fast, accessible, zero-config |
| **Language** | TypeScript strict | Catch bugs early, self-documenting |
| **Data** | Google Sheets | Zero cost, family can read it, migration-ready |
| **Files** | Google Drive | Free tier, private folder per family |
| **Calendar** | Google Calendar | Reminders sync natively |
| **AI (NEW)** | **Google Gemini API** | 1500 free calls/month, vision + JSON output |
| **Auth** | NextAuth + Google OAuth | Trust Google, no password resets |
| **Hosting** | Vercel free | Serverless + cron + API routes + PWA |
| **Rate Limit** | In-memory (no Redis) | Simpler, sufficient for MVP |
| **Cost** | ~$1–2/mo | Gemini vision (~$0.002/scan) is the only paid API |

**Revision:** Originally planned Anthropic Claude for bill extraction. **Switched to Gemini** for better free quota (1500 calls/mo vs ~60 with Claude free tier) and faster vision processing.

---

## Roles & Access Control

| Role | Can do |
|------|--------|
| **admin** | Everything + settings + member management |
| **editor** | Create/edit records (transactions, bills, assets, etc.) |
| **viewer** | Read only on allowed modules (set per member) |

**Example:** Grandmother (viewer) sees bills due + reminders, but no salary or spending details.

---

## Data Model (Google Sheets)

**One spreadsheet per family.** 16 tabs:

| # | Tab | Purpose |
|---|-----|---------|
| 1 | `family_members` | Users, roles, module visibility |
| 2 | `accounts` | Bank, cash, e-wallet, loans |
| 3 | `assets` | Property, vehicles, gold, electronics |
| 4 | `transactions` | Income, expense, transfer, adjustment |
| 5 | `transaction_categories` | Groceries, Transport, Utilities, etc. (with icons) |
| 6 | `bills` | Recurring bills (rent, utilities, subscriptions) |
| 7 | `bill_payments` | Payment history per bill |
| 8 | `reminders` | One-time + recurring reminders |
| 9 | `recurring_rules` | Rules for bill/reminder generation (cron-like) |
| 10 | `notes` | Important notes (P1, stub in MVP) |
| 11 | `settings` | Key-value config (family name, timezone, integrations) |
| 12 | `audit_logs` | Append-only change history |
| 13 | `calendar_sync_map` | Local reminders → Google Calendar event IDs |
| 14 | `ai_extraction_logs` | Bill scan history (cost, confidence, extraction) |
| 15 | `attachments` | Attachment metadata (P1; URLs stored inline in MVP) |
| 16 | `_system` | Metadata (schema version, backup timestamps) |

**Key detail:** No formulas, no hard-deletes. All data is raw. App logic computes `account.current_balance` nightly. Every write is audit-logged.

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────┐
│  Client (React Pages, SWR state)            │
├─────────────────────────────────────────────┤
│  API Routes (auth, validation, audit)       │
├─────────────────────────────────────────────┤
│  Domain Logic (pure, testable)              │
├─────────────────────────────────────────────┤
│  Integrations (Sheets, Drive, Calendar, AI) │
├─────────────────────────────────────────────┤
│  Google APIs                                │
└─────────────────────────────────────────────┘
```

**Principle:** No secrets in client. All Google/AI calls go through API routes. Domain logic is pure (no framework, no I/O). Repository abstraction isolates Sheets so migration to Postgres later is mechanical.

---

## MVP Scope (12 weeks)

**IN:**
- Google Sign-In, roles, module visibility
- CRUD for: accounts, assets, transactions, bills, reminders, recurring rules
- Quick Add transaction (4 taps)
- Scan Bill → Gemini → edit draft → save
- Bill mark-as-paid → auto-create transaction
- Recurring bill generator (nightly cron)
- Google Calendar push for reminders
- Drive upload for receipt images
- Dashboard with 5 cards
- PWA install + offline read cache
- Audit log (audit trail visible in Settings)
- Bahasa Indonesia locale (id-ID)

**OUT (v1.1+):**
- Notes full CRUD (read-only stub OK in MVP)
- Reports & charts
- Search across records
- CSV/PDF export
- Partial payment splits
- Recurring transactions (manual repeat is fine)
- Two-way Calendar sync
- Multi-currency

**NOT DOING:**
- Bank auto-sync (risky, expensive)
- Stock/crypto prices
- Tax reports
- Native iOS/Android (PWA only)
- Email/SMS (push notification P1)

---

## Bill Capture Flow (Detailed)

**The core feature — simple end-to-end:**

```
1. User taps "Scan Bill" FAB
2. Camera opens (via <input capture>)
3. User takes photo or uploads image
4. Image sent to Google Drive, then to Gemini API
5. Gemini extracts: merchant, date, amount, category, confidence
6. App shows draft form with:
   - All fields editable
   - Confidence scores per field (High/Med/Low)
   - Original image thumbnail (tap → full-screen)
7. User confirms (or edits)
8. Choice: save as Transaction only, Bill only, or Bill + mark paid
9. If "Bill + mark paid" → creates:
   - bill record (with due_date, recurrence)
   - payment record (with date, amount)
   - transaction record (expense)
   - optional: reminder (notify 3 days before next due)
   - optional: Google Calendar event
10. Success toast → return to Dashboard
```

**Cost:** ~$0.002 per scan (Gemini vision API). 100 scans/month = ~$0.20. **Never auto-save; always require user review.**

---

## Security Model (One-liner per layer)

| Layer | Control |
|-------|---------|
| **Transport** | HTTPS only (Vercel enforces) |
| **AuthN** | NextAuth + Google OAuth (7-day session max) |
| **AuthZ** | Server-side `canRead(member, module)` check on every API route |
| **Input** | Zod validation on every route boundary |
| **Secrets** | Vercel env vars only (never in `.env` on prod) |
| **XSS** | React escapes by default; CSP headers; no `dangerouslySetInnerHTML` |
| **CSRF** | NextAuth built-in; same-site lax cookies |
| **Audit** | Every write logs to `audit_logs` (member, action, entity, before/after) |
| **Storage** | Google Drive: private family folder, share = restricted, no link-anyone |
| **Backups** | Nightly JSON export to Drive `/backups/YYYY-MM-DD.json` + weekly email |

---

## Deployment & Operations

| Concern | Solution |
|---------|----------|
| **Hosting** | Vercel free tier (auto-deploys from GitHub main) |
| **Domain** | Optional custom domain via Cloudflare (free) |
| **Cron** | Vercel Cron Jobs (2 jobs: recurring bills @ 03:00 UTC, reminders @ 07:00 UTC) |
| **Monitoring** | Vercel logs + custom `/api/health` endpoint (checks integrations) |
| **Secrets** | Vercel environment variables (not `.env` files) |
| **Cost** | Free tier covers MVP ($0 Vercel + ~$2 Gemini API/month) |

**Scale to Pro ($20/mo) only if you need higher cron concurrency or advanced analytics.**

---

## Design & UX (Practical)

| Aspect | Approach |
|--------|----------|
| **Colors** | Trust blue (`#1E40AF`) + profit green (`#059669`), amber for due-soon, red for overdue |
| **Fonts** | Geist Sans (body), Geist Mono (code/numbers), both via next/font (0 CLS) |
| **Mobile-first** | 375px base, scales to tablet/desktop |
| **Touch targets** | Minimum 44×44px (tap-friendly for older users) |
| **Icons** | Lucide React (SVG, no emoji) |
| **Dark mode** | Supported; respected system preference |
| **Accessibility** | WCAG AA: 4.5:1 contrast, keyboard nav, ARIA labels, skip-link |
| **Perception** | Skeleton loaders, toasts for feedback, no spinners-only |
| **Language** | Bahasa Indonesia first (id-ID), layout ready for en-US |

**Principle:** "Non-technical spouse reads it with no explanation."

---

## Key Revisions from Original Spec

### 1. Gemini instead of Anthropic
- **Free quota:** 1500 calls/month (vs ~60 with Claude free)
- **Speed:** Gemini 2.0 Flash is faster
- **Cost per scan:** $0.002 (vs $0.01 with Claude)
- **Swappable:** Provider wrapping in `src/integrations/ai/` allows easy swap

### 2. No Redis
- **Rate limiting:** In-memory sliding window + Sheets query fallback
- **Caching:** Next.js `unstable_cache()` with `revalidateTag()` on mutations
- **Future:** Add Upstash Redis free tier only if needed (first 100 commands/day)

### 3. Detailed Specs Always
- This brief is self-contained
- CLAUDE.md has full architecture
- Schema details in CLAUDE.md (not ambiguous)
- Code comments point to this brief, not the reverse

---

## Success Criteria (MVP)

| Metric | Target |
|--------|--------|
| **Sign-in** | Google OAuth ✓ |
| **Transactions** | Family logs ≥30 in MVP sprint |
| **Bill scanning** | <15 seconds from tap to saved |
| **Offline** | Dashboard loads without network |
| **Accessibility** | Lighthouse ≥80, WCAG AA pass |
| **Uptime** | 99.9% (Vercel standard) |
| **Cost** | <$2/mo (actual spend, not theoretical) |
| **Usability** | Spouse uses weekly unassisted |

---

## 12-Week Build Plan

| Wks | Milestone | Done When |
|-----|-----------|-----------|
| 0 | Scaffold + env + auth | `npm install` runs, sign-in works |
| 1 | Sheets + onboarding | Family sheet created, members invited |
| 2 | Transactions CRUD | Add/edit/delete transactions, see in list |
| 3 | Accounts + Assets | Balances compute, transfers work |
| 4 | Bills + recurring | Bills track, cron generator runs, mark-paid works |
| 5 | Calendar + Reminders | Events push to Google Calendar, sync map maintained |
| 6 | **Gemini bill extraction** | Camera → Gemini → draft → save (blocker) |
| 7 | Dashboard | All 5 cards render, aggregator caches 30s |
| 8 | PWA + offline | Manifest valid, app-shell caches, write queue in IndexedDB |
| 9 | Security + roles | Module visibility enforced, rate limit works, audit logged |
| 10 | Performance + a11y | Lighthouse ≥80, VoiceOver readable, Indonesian copy |
| 11 | UAT | Family tests, bugs triaged, scope frozen |
| 12 | Launch | Deploy to Vercel, docs written, monitoring live |

---

## Risks & Limits

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Sheets 60 reads/min** | Performance ceiling | Cache (30s TTL), batch reads, paginate |
| **No transactions in Sheets** | Data inconsistency | Wrap multi-step ops in domain functions, audit trail for recovery |
| **Gemini hallucination** | Wrong extraction | Always show confidence, require user review, no auto-save |
| **Family member adds data to Sheets directly** | Schema corruption | Don't share Sheets with members; app is the only writer |
| **Large families (8+ members)** | Scale issues | Scope locked to ≤8 members, ≤50k rows total |

---

## Future Phases

| Version | Theme | Timeline |
|---------|-------|----------|
| **v1.1** | Notes + exports | Weeks 13–16 |
| **v1.2** | Reports + budget | Weeks 17–20 |
| **v1.3** | UX polish | Weeks 21–22 |
| **v2.0** | Postgres migration | Weeks 23–30 (repository pattern makes it easy) |
| **v2.1** | Push notifications + Calendar 2-way | Weeks 31–34 |
| **v2.2** | Multi-currency + bank sync | Weeks 35+ |

---

## Reference Files

- **CLAUDE.md** — Full project context, architecture, guidelines
- **GitHub** — Source of truth for code
- **Conversation transcript** — Design decisions & rationale

---

**Owner:** Personal project (single family)  
**Status:** MVP in progress (Week 1) — finance vertical ready, calendar/other modules in skeleton  
**Last updated:** 2026-05-16
