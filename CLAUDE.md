# FAMS — Project Context for Claude Code
**Last updated: 2026-05-15** · Personal finance PWA for one family

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

## Project Status & Tech Stack (REVISED)

| Aspect | Details |
|--------|---------|
| **Status** | MVP scaffolding in progress (Week 0-1) |
| **Frontend** | Next.js 16 (App Router) + React 19 |
| **Styling** | Tailwind CSS v4 (@tailwindcss/postcss) + shadcn/ui |
| **Language** | TypeScript (strict mode) |
| **Data Backend** | Google Sheets (single spreadsheet, 16 tabs) |
| **File Storage** | Google Drive (family folder for receipts/attachments) |
| **Calendar** | Google Calendar (reminders sync) |
| **Image-to-Data** | **Google Gemini API** (vision + structured extraction) |
| **Auth** | NextAuth.js + Google OAuth |
| **Deployment** | Vercel free tier (supports Next.js API routes + cron) |
| **Fonts** | Geist Sans + Geist Mono (via next/font/google, display: swap) |
| **PWA** | next-pwa with offline read cache + IndexedDB write queue |
| **Rate Limiting** | In-memory sliding window + Sheets query fallback (no Redis) |
| **Cost** | ~$1–2/month (APIs on free tier) |

---

## Key Revisions from Original Spec

### 1. **Use Google Gemini API instead of Anthropic Claude for bill extraction**

**Why:** Gemini Vision has a more generous free tier (1500 free API calls/month) and is optimized for structured JSON output.

**Configuration:**
- Get API key at [aistudio.google.com](https://aistudio.google.com)
- Store in `.env.GEMINI_API_KEY`
- Model: `gemini-2.0-flash` (fast, cheap, vision-capable)
- System prompt cached (Anthropic SDK style) to reduce per-call cost

**Cost:** ~$0.002 per image extraction. For 100 scans/month = ~$0.20.

**Swappable:** `src/integrations/ai/client.ts` wraps provider logic. Can swap to Claude/OpenAI later without changing domain code.

**Implementation in `src/integrations/ai/providers/gemini.ts`:**
```typescript
// Provider abstraction — all domain code calls ai/client.ts
async function extractBill(image: Buffer): Promise<BillExtraction> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const base64 = image.toString('base64');
  
  const result = await model.generateContent([
    { inlineData: { mimeType: 'image/jpeg', data: base64 } },
    { text: cachedBillExtractionPrompt() }
  ]);
  
  const json = JSON.parse(result.response.text());
  return BillExtractionSchema.parse(json);
}
```

### 2. **No Redis for rate limiting or caching**

**Why:** Adds operational complexity. For MVP, simple in-memory sliding-window counter is sufficient.

**Rate limiting approach:**
- Track requests in memory (per-member, per endpoint).
- Fallback: query `audit_logs` sheet for last 60 writes in past 60 seconds.
- Limits: 60 writes/min, 30 AI calls/hour, 30 GB Drive uploads/month.
- Return 429 if exceeded; include `Retry-After` header.

**Caching approach:**
- Next.js `unstable_cache()` with `revalidateTag()` on mutations.
- TTL: 30 seconds for list views, 5 minutes for dashboard aggregates.
- No Redis, no Upstash required.

**Future migration:** If needed, add Upstash Redis free tier (first 100 commands/day free) or an in-memory store with memory bounds.

---

## Architecture Overview

### Layers (clean separation)
1. **API routes** (`app/api/**`) — thin, delegate to domain.
2. **Domain logic** (`src/domain/**`) — pure, no framework, no I/O.
3. **Repository/Integration** (`src/integrations/**`) — Sheets/Drive/Calendar/AI.
4. **UI/Pages** (`app/(app)/**`) — React components, call API routes, SWR for state.
5. **Lib/Utils** (`src/lib/**`) — helpers (money, audit, auth, logger).

### Key Patterns
- **No secrets in client.** All Google/AI calls are server-side only.
- **Zod validation at boundaries.** API routes validate request bodies.
- **Audit every write.** `writeAudit()` called after mutations.
- **Soft deletes.** Never hard-delete; mark `deleted_at`.
- **ULIDs for IDs.** Time-sortable, unique, prefix-able (`tx_…`, `bill_…`, etc.).

---

## Detailed Project Structure

```
fams/
├── CLAUDE.md                    ← You are here (project context).
├── PROJECT_BRIEF.md             ← One-pager (scope, modules, brief).
├── package.json                 ← All dependencies.
├── next.config.mjs              ← PWA + CSP + image config.
├── tsconfig.json, tailwind.config.ts, postcss.config.mjs, eslint.config.mjs
├── vitest.config.ts
├── .env.local                   ← Secrets (never commit).
├── .env.example
├── .gitignore
└── src/
    ├── app/
    │   ├── globals.css          ← Design tokens (colors, fonts, utilities).
    │   ├── layout.tsx           ← Root layout (fonts, metadata, PWA).
    │   ├── manifest.webmanifest ← PWA manifest.
    │   ├── (auth)/
    │   │   ├── sign-in/page.tsx
    │   │   └── onboarding/page.tsx
    │   ├── (app)/
    │   │   ├── layout.tsx       ← App shell (nav + safe-area).
    │   │   ├── page.tsx         ← Dashboard.
    │   │   ├── transactions/, bills/, assets/, accounts/, reminders/, scan/, settings/
    │   │   └── offline/, error.tsx, not-found.tsx
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       ├── sheets/          ← Data API (transactions, bills, accounts, etc.).
    │       ├── ai/extract/route.ts         ← Gemini vision.
    │       ├── drive/upload/route.ts
    │       ├── calendar/(push|delete)/route.ts
    │       ├── cron/(recurring|reminders|backup)/route.ts
    │       ├── audit/route.ts, health/route.ts
    │       └── attachments/[id]/route.ts (P1)
    ├── components/
    │   ├── ui/                  ← shadcn/ui primitives (Button, Input, Select, Sheet, etc.).
    │   ├── finance/             ← Finance domain (MoneyInput, MoneyDisplay, StatusChip, etc.).
    │   ├── nav/                 ← Bottom nav, app bar.
    │   ├── layout/              ← SafeArea, AppShell.
    │   └── sections/            ← EmptyState, LoadingState, ErrorState.
    ├── domain/
    │   ├── types.ts             ← Zod schemas + inferred types.
    │   ├── transactions.ts, bills.ts, recurring.ts
    │   ├── permissions.ts       ← canRead(), canWrite() per module.
    │   ├── currency.ts, constants.ts
    │   └── ... (pure business logic, no framework deps).
    ├── integrations/
    │   ├── sheets/
    │   │   ├── client.ts        ← googleapis init.
    │   │   ├── schema.ts        ← Column letter map.
    │   │   ├── repository.ts    ← Generic base class.
    │   │   ├── mappers/         ← Row ↔ object conversion.
    │   │   └── repositories/    ← Specific entities (TransactionsRepository, etc.).
    │   ├── calendar/client.ts
    │   ├── drive/client.ts
    │   ├── ai/
    │   │   ├── client.ts        ← Provider-agnostic interface.
    │   │   ├── providers/gemini.ts, anthropic.ts (future)
    │   │   ├── prompts/bill-extraction.ts
    │   │   └── parsers.ts       ← JSON schema validation.
    │   └── localization/        ← i18n strings (id-ID, en-US).
    ├── lib/
    │   ├── env.ts               ← Zod-validated environment variables.
    │   ├── auth.ts              ← NextAuth config.
    │   ├── ulid.ts, money.ts, logger.ts, audit.ts
    │   ├── cache.ts, rate-limit.ts, validators.ts
    │   └── hooks.ts
    ├── hooks/
    │   ├── use-auth.ts, use-permission.ts, use-dashboard.ts
    │   ├── use-money-input.ts, use-camera.ts, use-offline.ts
    │   └── ...
    ├── types/
    │   ├── index.ts, api.ts
    │   └── ...
    └── styles/
        └── tokens.css
```

---

## Google Sheets Schema (16 Tabs)

All tabs follow these conventions:
- **Row 1:** Column headers.
- **Row 2+:** Data.
- **IDs:** ULIDs with prefixes (`tx_…`, `bill_…`, `mem_…`, etc.).
- **Dates:** ISO 8601 (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`).
- **Money:** Integer minor units (no decimals for IDR, but keep field as int for future non-IDR).
- **Soft delete:** `deleted_at` column (never hard-delete).
- **No formulas:** All data is raw (caching + app logic handles derivations).

### Tabs (brief descriptions)

1. **family_members** — Users, roles, module access.
2. **accounts** — Bank, cash, e-wallet, loan accounts. `current_balance` is derived nightly.
3. **assets** — Property, vehicles, gold, electronics. Optionally linked to accounts.
4. **transactions** — Income, expense, transfer, adjustment, refund. `amount` always positive; sign from `type`.
5. **transaction_categories** — Expense categories (Groceries, Transport, Utilities, etc.) with icons.
6. **bills** — Recurring bills (electricity, rent, subscriptions). `due_date` is next-due.
7. **bill_payments** — Payment history for each bill. Links to transactions if auto-created.
8. **reminders** — One-time + recurring reminders. Synced to Google Calendar via `calendar_event_id`.
9. **recurring_rules** — RRULE-like rules for bills/reminders/transactions. Cron job clones template on `next_run_at`.
10. **notes** — Important notes (emergency contacts, insurance, family agreements). P1 in MVP.
11. **settings** — Key-value config (family name, timezone, integrations).
12. **audit_logs** — Append-only. Every create/update/delete logs here.
13. **calendar_sync_map** — Maps local reminders/bills to Google Calendar event IDs.
14. **ai_extraction_logs** — Track all bill scans (raw response, parsed extraction, confidence, cost).
15. **attachments** — Normalized attachment table (P1; in MVP, URLs stored inline).
16. **_system** — Metadata (schema_version, last_backup_at, etc.).

**Full column details:** See PROJECT_BRIEF.md §12.

---

## Implementation Roadmap (12 weeks)

| Week | Focus | Checkpoint |
|------|-------|-------------|
| 0 | Scaffold + env + auth | `npm install` runs, sign-in works, family created |
| 1 | Sheets + Onboarding | Spreadsheet created, members invited |
| 2 | Transactions (vertical slice) | Add expense, view list, edit, audit log visible |
| 3 | Accounts + Assets | Account transfers, asset grouping |
| 4 | Bills + Recurring | Bill CRUD, mark paid, cron generator |
| 5 | Calendar + Reminders | Push events, sync map, notification flow |
| 6 | **Gemini Bill Extraction** | Camera → Gemini → draft → save (MVP blocker) |
| 7 | Dashboard | All 5 cards, aggregator API |
| 8 | PWA + Offline | Manifest, icons, service worker, write queue |
| 9 | Security + Roles | Module visibility, rate limiting, CSP |
| 10 | Performance + a11y | Lighthouse ≥80, VoiceOver pass, Indonesian copy |
| 11 | UAT | Family testing, bug triage, freeze scope |
| 12 | Launch | Vercel deploy, runbooks, monitoring |

---

## Code Guidelines

### TypeScript
- Strict mode enabled. No `any` without a comment explaining why.
- Use Zod for runtime validation at API boundaries.
- Exported types from `src/domain/types.ts`.

### Domain Logic (`src/domain/`)
- Pure functions, no side effects, no framework imports.
- No database calls (pass data as arguments).
- Easy to test with Vitest.

### API Routes (`app/api/**`)
- Validate with Zod; return `{ ok: true/false, data?, error? }` shape.
- Call domain logic, then repository.
- Always audit writes via `writeAudit()`.
- Check permissions first: `if (!canWrite(member, module)) return 403`.

### Components (`src/components/`)
- Use shadcn/ui primitives as building blocks.
- Finance components use Tailwind `tabular-nums` for money.
- Accessibility: 44×44dp touch targets, ARIA labels, no emoji icons.

### Styling
- Design tokens in `app/globals.css` (colors, fonts, spacing).
- Tailwind utilities for layouts.
- Dark mode via `.dark` class (respects system preference).
- Status colors: green (paid), amber (due-soon), red (overdue).

### Testing
- Unit: `vitest` in `tests/unit/`.
- Component: React Testing Library.
- E2E: Playwright in `tests/e2e/`.
- Pre-commit: `npm lint` + `npm typecheck`.

### i18n
- Default locale: `id-ID` (Bahasa Indonesia).
- Strings in `src/integrations/localization/id-ID.ts`.
- Format money with `Intl.NumberFormat('id-ID', ...)`.

---

## Before You Start Coding

### 1. Install Node.js
Download LTS from [nodejs.org](https://nodejs.org) or:
```bash
winget install OpenJS.NodeJS.LTS
```
Then restart your terminal.

### 2. Clone & Install
```bash
cd D:\Project\fams
npm install
```

### 3. Create `.env.local`
Copy `.env.example` to `.env.local` and fill in:
- **NEXTAUTH_SECRET:** `openssl rand -base64 32`
- **GOOGLE_CLIENT_ID / SECRET:** OAuth 2.0 from Google Cloud Console
- **GOOGLE_SA_EMAIL / KEY:** Service Account JSON
- **GEMINI_API_KEY:** From [aistudio.google.com](https://aistudio.google.com)
- **GOOGLE_SHEETS_ID, GOOGLE_DRIVE_FOLDER_ID, GOOGLE_CALENDAR_ID:** After first sign-in

### 4. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Read before coding
1. This file (CLAUDE.md) — you're reading it.
2. **PROJECT_BRIEF.md** — scope, modules, UX notes.
3. **Schemas in PROJECT_BRIEF.md §12** — understand data model.

---

## Known Limitations

| Issue | Impact | Mitigation |
|-------|--------|-----------|
| Sheets 60 reads/min quota | Performance ceiling | Cache (30s), batch reads, pagination |
| No transactions in Sheets | Data consistency risk | Audit trail for recovery; domain functions wrap multi-step ops |
| Sheets queries are slow | List lag | Partition by year; pagination; SWR client-side |
| Gemini may hallucinate fields | AI confidence < 100% | Always show confidence; user reviews before save |
| No real-time updates | Stale data risk | Poll with SWR; P1 WebSocket later |

---

## Deployment (Vercel)

1. Push code to GitHub `main` branch.
2. Vercel auto-deploys.
3. Set environment variables in Vercel dashboard (not `.env` files).
4. Cron jobs via Vercel's built-in scheduler.

**Cost:** Free tier adequate for MVP. Scale to Pro ($20/month) only if you need advanced analytics or higher cron concurrency.

---

## Future Migrations

### v2.0 — Postgres + Drizzle
- Migrate Sheets → Neon free tier (0.5GB).
- Repository pattern makes this mechanical.
- Keep Sheets as read-only mirror.

### v2.1 — Push Notifications
- Web Push for reminders.
- Two-way Google Calendar sync.

### v2.2 — Multi-currency & Bank Sync
- Multi-currency support.
- Open Banking API (P2, risky).

---

## Questions?

Refer to:
1. This file (CLAUDE.md).
2. **PROJECT_BRIEF.md**.
3. Conversation transcript.

Ask with full context: module, error, what you tried.
