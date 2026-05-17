# FAMS — Project Context for Claude Code

**Last updated: 2026-05-17** · Personal finance PWA for one family

---

## What Is FAMS?

FAMS (Family Asset & Money System) is a **private, mobile-first Progressive Web App (PWA)** designed for a single family to:

- Track income, expenses, and cash flow
- Manage assets (cash, bank accounts, vehicles, property, gold, electronics, etc.)
- Track bills with due dates and payment history
- Capture bills via camera using AI image extraction
- Set reminders and sync to Google Calendar
- Save important notes and documents
- Maintain a complete audit trail of who changed what

**Users:** One family, up to 8 members, with role-based access (admin/editor/viewer).

**Core principle:** Simple enough for non-technical users (kids, elderly), but architecture is clean and migration-ready for future scaling.

---

## Project Status & Tech Stack

| Aspect             | Details                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| **Status**         | Week ~5 — Core finance modules complete; calendar/scanning/offline WIP |
| **Frontend**       | Next.js 16.2.6 (App Router) + React 19.2.4                             |
| **React Compiler** | Enabled (`reactCompiler: true` in next.config.ts)                      |
| **Styling**        | Tailwind CSS v4 + shadcn/ui                                            |
| **Language**       | TypeScript 5 (strict mode)                                             |
| **Data Backend**   | Google Sheets (single spreadsheet, ~14 tabs active)                    |
| **File Storage**   | Google Drive (family folder for receipts/attachments)                  |
| **Calendar**       | Google Calendar (one-way push via API)                                 |
| **Image-to-Data**  | Google Gemini API (`gemini-2.0-flash`, vision + structured extraction) |
| **Auth**           | NextAuth.js v4 + Google OAuth                                          |
| **Telegram Bot**   | Grammy v1 — quick commands (saldo, add transaction, assets, budget)    |
| **Deployment**     | Vercel free tier                                                       |
| **Fonts**          | Geist Sans + Geist Mono (via `next/font/google`, display: swap)        |
| **PWA**            | Manifest present; service worker / offline queue not yet wired         |
| **Rate Limiting**  | In-memory sliding window + Sheets fallback (no Redis)                  |
| **State**          | SWR v2 for client-side data fetching                                   |
| **Forms**          | react-hook-form v7 + Zod v4 resolvers                                  |
| **Notifications**  | Sonner (toast)                                                         |
| **Cost**           | ~$1–2/month (Gemini API only paid service)                             |

---

## Architecture Overview

### Layers (clean separation)

1. **API routes** (`src/app/api/**`) — thin, delegate to domain + repositories.
2. **Domain logic** (`src/domain/**`) — pure functions, no framework, no I/O.
3. **Repository/Integration** (`src/integrations/**`) — Sheets/Drive/Calendar/AI.
4. **UI/Pages** (`src/app/(app)/**`) — React components, call API routes, SWR for state.
5. **Lib/Utils** (`src/lib/**`) — money, audit, auth, logger, rate-limit, env.

### Key Patterns

- **No secrets in client.** All Google/AI calls are server-side only.
- **Zod validation at boundaries.** API routes validate all request bodies.
- **Audit every write.** `writeAudit()` called after every mutation.
- **Soft deletes.** Never hard-delete; mark `deleted_at`.
- **ULIDs for IDs.** Time-sortable with prefixes (`tx_`, `bill_`, `mem_`, etc.).
- **Response shape:** `{ ok: true, data }` or `{ ok: false, error }` from all API routes.
- **Permissions first.** `canWrite(member, module)` checked before any mutation.

---

## Implementation Status

### ✅ Fully Implemented

- **Auth** — NextAuth + Google OAuth, session management, onboarding flow
- **Finance / Transactions** — Full CRUD, filters (category/date/account), period picker, audit
- **Finance / Accounts** — Bank, cash, e-wallet, loan CRUD; transfer form
- **Finance / Assets** — Property, vehicle, gold, electronics CRUD; grouped view
- **Finance / Bills** — Recurring bills + payment history
- **Finance / Budgets** — Budget/category setup, monthly budget tracking
- **Dashboard** — 5-card summary (total balance, monthly income/expense, budgets, recent transactions)
- **Settings / Members** — Member CRUD + role assignment
- **Settings / Audit Log** — Append-only change log view
- **Settings / Finance Setup** — Category and budget management
- **Google Sheets integration** — Base repository + 11 entity repositories, all 14 tabs mapped
- **Google Calendar integration** — Push and delete events (one-way)
- **Rate limiting** — In-memory sliding window (60 writes/min, 30 AI calls/hr)
- **Audit trail** — `writeAudit()` + retrieval API
- **Navigation** — Desktop sidebar + mobile bottom pill + FAB with quick-add sheet
- **Dark mode** — System preference + manual toggle (ThemeProvider)
- **Telegram bot** — 4 commands: `/catat`, `/saldo`, `/anggaran`, `/assets`; polling (local dev) + webhook (Vercel production)

### 🚧 Skeleton / Partial

- **Bill scanning** (`/api/ai/extract`, `/scan`) — Endpoint exists, UI not built
- **Reminders** — API CRUD done; Google Calendar sync map exists; UI skeleton
- **Calendar views** (`/calendar/*`) — Page shells only
- **Notes** (`/other/notes`) — Shell only
- **Maintenance** (`/other/maintenance`) — Shell only
- **Vault** (`/other/vault`) — Shell only
- **Reports** (`/finance/reports`) — Planned v1.2
- **Notifications hub** (`/notifications`) — Route exists, no content

### ❌ Not Yet Started

- **PWA service worker + offline write queue** — Manifest exists; SW and IndexedDB queue not wired
- **Unit/e2e tests** — Vitest and Playwright configured; no test specs written
- **CSV/PDF export**
- **Two-way calendar sync**
- **Web Push notifications**

---

## Project Structure (Actual)

```
fams/
├── CLAUDE.md                    ← You are here.
├── PROJECT_BRIEF.md             ← Scope, modules, full schema.
├── AGENTS.md                    ← Agent rules (navigation, page status conventions).
├── package.json
├── next.config.ts               ← React compiler, image remotes, CSP headers.
├── tsconfig.json
├── vitest.config.ts
├── components.json              ← shadcn/ui config.
├── postcss.config.mjs, eslint.config.mjs
├── .env.example, .env.local     ← Secrets (never commit .env.local).
│
├── bot/                         ← Telegram bot (local polling mode via index.ts; production uses webhook).
│   ├── index.ts                 ← Grammy entrypoint (polling, for local dev only).
│   ├── state.ts                 ← User session state.
│   └── commands/                ← Shared between polling and webhook modes.
│       ├── add-transaction.ts
│       ├── saldo.ts
│       ├── assets.ts
│       └── anggaran.ts
│
├── public/
│   └── manifest.webmanifest     ← PWA manifest.
│
└── src/
    ├── app/
    │   ├── globals.css          ← Design tokens (colors, fonts).
    │   ├── layout.tsx           ← Root layout (fonts, metadata, providers).
    │   ├── page.tsx             ← Redirects to /home.
    │   │
    │   ├── (auth)/
    │   │   ├── sign-in/page.tsx
    │   │   └── onboarding/page.tsx
    │   │
    │   ├── (app)/               ← Protected app shell (auth check, sidebar + bottom nav).
    │   │   ├── layout.tsx
    │   │   ├── home/page.tsx    ← Dashboard.
    │   │   ├── notifications/page.tsx
    │   │   ├── finance/
    │   │   │   ├── dashboard/page.tsx
    │   │   │   ├── transactions/page.tsx
    │   │   │   ├── accounts/page.tsx
    │   │   │   ├── assets/page.tsx
    │   │   │   ├── aset/page.tsx        ← Grouped accounts + assets view.
    │   │   │   ├── anggaran/page.tsx    ← Budget view.
    │   │   │   ├── bills/page.tsx
    │   │   │   └── reports/page.tsx     ← Skeleton (v1.2).
    │   │   ├── calendar/
    │   │   │   ├── page.tsx             ← Skeleton.
    │   │   │   ├── events/page.tsx      ← Skeleton.
    │   │   │   └── reminders/page.tsx   ← Skeleton.
    │   │   ├── other/
    │   │   │   ├── maintenance/page.tsx ← Skeleton.
    │   │   │   ├── notes/page.tsx       ← Skeleton.
    │   │   │   └── vault/page.tsx       ← Skeleton.
    │   │   └── settings/
    │   │       ├── page.tsx             ← Settings hub.
    │   │       ├── members/page.tsx
    │   │       ├── notifications/page.tsx ← Skeleton.
    │   │       ├── integrations/page.tsx  ← Skeleton.
    │   │       ├── audit-log/page.tsx
    │   │       └── finance-setup/
    │   │           ├── categories/page.tsx
    │   │           └── budgets/page.tsx
    │   │
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       ├── health/route.ts
    │       ├── audit/route.ts
    │       ├── sheets/
    │       │   ├── transactions/route.ts + [id]/route.ts
    │       │   ├── accounts/route.ts + [id]/route.ts
    │       │   ├── assets/route.ts + [id]/route.ts
    │       │   ├── categories/route.ts + [id]/route.ts
    │       │   ├── budgets/route.ts + [id]/route.ts
    │       │   ├── members/me/route.ts
    │       │   ├── reminders/route.ts + [id]/route.ts
    │       │   └── init/route.ts        ← Spreadsheet initialization.
    │       ├── ai/extract/route.ts      ← Gemini vision (skeleton).
    │       ├── calendar/push/route.ts + delete/route.ts
    │       └── telegram/
    │           ├── setup/route.ts
    │           └── webhook/route.ts
    │
    ├── components/
    │   ├── ui/                  ← shadcn/ui primitives.
    │   ├── finance/             ← Domain components (see list below).
    │   ├── nav/                 ← app-sidebar, bottom-nav, add-sheet, add-transaction-dialog, scan-dialog.
    │   ├── layout/              ← page-container.
    │   ├── sections/            ← empty-state, error-state, loading-state, page-skeleton.
    │   ├── settings/            ← finance-category-settings, finance-setup-nav.
    │   ├── providers.tsx        ← SessionProvider + ThemeProvider + Toaster.
    │   ├── theme-provider.tsx
    │   └── theme-toggle.tsx
    │
    ├── domain/
    │   ├── types.ts             ← All Zod schemas + inferred types.
    │   ├── transactions.ts      ← groupByDate, sumByType, getMonthRange, computeBalanceDelta.
    │   ├── categories.ts        ← Category validation, defaults, icon mappings.
    │   ├── permissions.ts       ← canRead(), canWrite(), canAdmin().
    │   └── constants.ts         ← Default categories, account types, labels.
    │
    ├── integrations/
    │   ├── sheets/
    │   │   ├── client.ts        ← googleapis init + auth.
    │   │   ├── schema.ts        ← Column mappings (A–Z) for all tabs.
    │   │   ├── repository.ts    ← Base class (findAll, findById, create, update, softDelete).
    │   │   └── repositories/    ← transactions, accounts, assets, bills, reminders,
    │   │                           family-members, audit-logs, settings,
    │   │                           calendar-sync-map, transaction-categories, budgets.
    │   ├── calendar/client.ts
    │   ├── drive/client.ts
    │   └── ai/                  ← (skeleton) client.ts, providers/gemini.ts, prompts/.
    │
    ├── lib/
    │   ├── env.ts               ← Zod-validated env vars.
    │   ├── auth.ts              ← NextAuth config.
    │   ├── ulid.ts, money.ts, logger.ts, audit.ts
    │   ├── rate-limit.ts        ← In-memory sliding window.
    │   ├── api-helpers.ts       ← getSessionMember(), ok(), fail().
    │   └── utils.ts             ← cn() + misc helpers.
    │
    ├── hooks/
    │   ├── use-transactions.ts  ← GET + POST/PATCH/DELETE via SWR.
    │   ├── use-accounts.ts, use-assets.ts, use-budgets.ts
    │   ├── use-categories.ts, use-favorite-category-ids.ts
    │   ├── use-reminders.ts
    │   └── use-mobile.ts        ← Media query (< lg).
    │
    └── types/
        └── next-auth.d.ts       ← Extends Session with custom fields.
```

---

## Finance Components (`src/components/finance/`)

| Component                         | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `money-input.tsx`                 | Number input with IDR formatting         |
| `money-display.tsx`               | Formatted currency (tabular-nums)        |
| `status-chip.tsx`                 | Status badges: paid / due-soon / overdue |
| `transaction-item.tsx`            | Single transaction row                   |
| `transaction-form.tsx`            | Add/edit transaction form                |
| `transaction-category-picker.tsx` | Category dropdown                        |
| `transaction-filter-bar.tsx`      | Filter UI (category / date / account)    |
| `account-form.tsx`                | Add/edit account form                    |
| `asset-form.tsx`                  | Add/edit asset form                      |
| `asset-registry-manager.tsx`      | Grouped asset management                 |
| `category-form.tsx`               | Category editor                          |
| `transfer-form.tsx`               | Inter-account transfer                   |
| `period-picker.tsx`               | Date range selector                      |
| `month-picker.tsx`                | Month/year selector                      |

---

## Node.js / npm Setup

This machine uses **fnm** (Fast Node Manager). Always resolve the active Node version before
running any `node`, `npm`, or `npx` commands:

```powershell
$fnmNode = (Get-ChildItem "C:\Users\adekm\AppData\Local\fnm_multishells" -Directory |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1).FullName
$env:PATH = "$fnmNode;$env:PATH"
# then run: npm install / node script.js / npx etc.
```

---

## Dev Commands

```bash
# Run Next.js + Telegram bot together (local development, recommended)
npm run dev

# Next.js only (webhook already set up via /api/telegram/webhook)
npm run dev:web

# Telegram bot only (polling mode, local only)
npm run bot

# Build (production, Vercel uses webhook mode)
npm run build

# Lint
npm run lint
```

`npm run dev` uses `concurrently` to run both processes — watch logs labeled `[next]` and `[bot]`. The bot runs in polling mode locally for easier testing and debugging.

---

## Environment Variables (`.env.local`)

```
NEXTAUTH_SECRET=            # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=           # OAuth 2.0 client
GOOGLE_CLIENT_SECRET=

GOOGLE_SA_EMAIL=            # Service Account email
GOOGLE_SA_PRIVATE_KEY=      # Service Account private key (PEM)

GOOGLE_SHEETS_ID=           # Created after first sign-in + /api/sheets/init
GOOGLE_CALENDAR_ID=

GEMINI_API_KEY=             # aistudio.google.com

TELEGRAM_BOT_TOKEN=         # @BotFather
TELEGRAM_WEBHOOK_SECRET=    # random string for webhook verification
```

---

## Google Sheets Schema (14 active tabs)

All tabs follow these conventions:

- **Row 1:** Column headers.
- **Row 2+:** Data.
- **IDs:** ULIDs with prefixes (`tx_`, `bill_`, `mem_`, etc.).
- **Dates:** ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`).
- **Money:** Integer minor units (IDR has no decimals; field is int for future multi-currency).
- **Soft delete:** `deleted_at` column — never hard-delete.
- **No formulas:** All data is raw; app handles derivations.

| #   | Tab                      | Description                                                   |
| --- | ------------------------ | ------------------------------------------------------------- |
| 1   | `family_members`         | Users, roles, module access                                   |
| 2   | `accounts`               | Bank, cash, e-wallet, loan accounts                           |
| 3   | `assets`                 | Property, vehicles, gold, electronics                         |
| 4   | `transactions`           | Income/expense/transfer/adjustment — `amount` always positive |
| 5   | `transaction_categories` | Categories with icons                                         |
| 6   | `bills`                  | Recurring bills — `due_date` is next-due                      |
| 7   | `bill_payments`          | Payment history, links to transactions                        |
| 8   | `reminders`              | One-time + recurring; synced via `calendar_event_id`          |
| 9   | `recurring_rules`        | RRULE-like rules; cron clones on `next_run_at`                |
| 10  | `notes`                  | Emergency contacts, agreements, insurance (skeleton)          |
| 11  | `settings`               | Key-value config (family name, timezone, integrations)        |
| 12  | `audit_logs`             | Append-only; every create/update/delete                       |
| 13  | `calendar_sync_map`      | Local reminder/bill → Google Calendar event ID                |
| 14  | `budgets`                | Monthly budget per category                                   |

Full column details: see PROJECT_BRIEF.md §12.

---

## Implementation Roadmap (12 weeks)

| Week | Focus                         | Status                                    |
| ---- | ----------------------------- | ----------------------------------------- |
| 0    | Scaffold + env + auth         | ✅ Done                                   |
| 1    | Sheets + Onboarding           | ✅ Done                                   |
| 2    | Transactions (vertical slice) | ✅ Done                                   |
| 3    | Accounts + Assets             | ✅ Done                                   |
| 4    | Bills + Recurring             | ✅ Done                                   |
| 5    | Calendar + Reminders          | 🚧 APIs done, UI skeleton                 |
| 6    | **Gemini Bill Extraction**    | 🚧 Endpoint skeleton, UI not built        |
| 7    | Dashboard                     | ✅ Done                                   |
| 8    | PWA + Offline                 | ❌ Not started                            |
| 9    | Security + Roles              | ✅ Logic done; no test coverage yet       |
| 10   | Performance + a11y            | 🚧 Tailwind in place; no Lighthouse audit |
| 11   | UAT                           | Upcoming                                  |
| 12   | Launch                        | Upcoming                                  |

---

## Code Guidelines

### TypeScript

- Strict mode. No `any` without an inline comment explaining why.
- Zod for runtime validation at every API boundary.
- All domain types exported from `src/domain/types.ts`.

### Domain Logic (`src/domain/`)

- Pure functions, no side effects, no framework or Node imports.
- Pass data as arguments — no repository calls inside domain.
- Should be easy to unit-test with Vitest.

### API Routes (`src/app/api/**`)

- Validate request body with Zod.
- Return `{ ok: true, data }` or `{ ok: false, error }`.
- Check permissions before any mutation: `if (!canWrite(member, module)) return 403`.
- Call `writeAudit()` after every successful mutation.
- Use `getSessionMember()` from `src/lib/api-helpers.ts` for auth.

### Components (`src/components/`)

- Use shadcn/ui primitives as building blocks.
- Finance components use `tabular-nums` class for money alignment.
- Touch targets ≥ 44×44px. ARIA labels on icon-only buttons.

### Styling

- Design tokens in `src/app/globals.css`.
- Tailwind utilities for layout.
- Dark mode via `.dark` class (system preference + manual toggle).
- Status colors: green = paid, amber = due-soon, red = overdue.

### Testing

- Unit: `vitest` in `tests/unit/` — **no specs written yet**.
- Component: React Testing Library.
- E2E: Playwright in `tests/e2e/` — **not started**.
- Pre-commit target: `npm run lint`.

### i18n

- Default locale: `id-ID` (Bahasa Indonesia).
- Format money with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })`.

---

## Known Limitations

| Issue                            | Impact                | Mitigation                                             |
| -------------------------------- | --------------------- | ------------------------------------------------------ |
| Sheets 60 reads/min quota        | Performance ceiling   | SWR cache (30s TTL), batch reads                       |
| No atomic transactions in Sheets | Data consistency risk | Audit trail for recovery; domain wraps multi-step ops  |
| Sheets queries are slow          | List lag              | Paginate; SWR stale-while-revalidate                   |
| Gemini may hallucinate fields    | AI confidence < 100%  | Show confidence score; user reviews before save        |
| No real-time updates             | Stale data            | SWR polling; WebSocket is P1 post-MVP                  |
| No test coverage                 | Regression risk       | Priority: add unit tests for domain + repository layer |

---

## Deployment (Vercel)

### Web App

1. Push to GitHub `main` branch — Vercel auto-deploys.
2. Set all env vars in Vercel dashboard (not `.env` files).
3. Cron jobs via Vercel's built-in scheduler (planned: recurring bills @03:00 UTC, reminders @07:00 UTC).

### Telegram Bot (Webhook Mode)

The bot runs in **webhook mode** on Vercel (not polling), using the route `/api/telegram/webhook`.

**Initial Setup (one-time after deploy):**

1. Deploy the Next.js app to Vercel.
2. Call `GET /api/telegram/setup` to register the webhook URL with Telegram.
   ```bash
   curl https://your-app.vercel.app/api/telegram/setup
   ```
3. Verify webhook is active:
   ```bash
   curl https://your-app.vercel.app/api/telegram/setup  # GET returns webhook info
   ```

**Local Development:**

- Run `npm run dev` to start both Next.js and the Telegram bot (polling mode).
- The bot imports commands from `bot/commands/` for both polling and webhook modes.
- Changes to commands in `bot/commands/` are reflected in both modes.

**Production vs. Local:**

- **Vercel (production):** Bot runs via webhook at `/api/telegram/webhook` (no separate process).
- **Local dev:** Bot runs as separate process via `npm run dev` (polling mode for easier testing).

**Cost:** Free tier adequate for MVP.

---

## Future Migrations

### v2.0 — Postgres + Drizzle

- Migrate Sheets → Neon free tier (0.5 GB).
- Repository pattern makes this mechanical swap.

### v2.1 — Push Notifications + Two-way Calendar Sync

- Web Push for reminders.
- Full two-way Google Calendar sync.

### v2.2 — Multi-currency & Bank Sync

- Multi-currency UI (schema already supports it).
- Open Banking API (P2, risky).

---

## Questions?

Refer to:

1. This file (CLAUDE.md).
2. **PROJECT_BRIEF.md** — full scope, module UX notes, column-level schema.
3. **AGENTS.md** — page status conventions and navigation rules for code generation.

Ask with full context: which module, the error, what you tried.
