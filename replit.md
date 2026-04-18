# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Platform Expansion (Tasks 1–13)

### New Packages / Artifacts

| Path | Purpose |
|---|---|
| `artifacts/hub/` | React SPA — login, dashboard, grants, subcontracts, reddit-intel pages |
| `lib/db/src/schema/` | 8 new DB tables (see below) |
| `artifacts/api-server/src/scrapers/` | SAM.gov, Grants.gov, USASpending, FL-VBS, Reddit scrapers |
| `artifacts/api-server/src/agents/` | QA, deduplication, gap-detection agents + stubs |
| `artifacts/api-server/src/email/` | Email service, guardrails, templates, daily brief |
| `artifacts/api-server/src/scheduler.ts` | Daily cron at 06:00 America/New_York |
| `artifacts/api-server/src/auth.ts` | Session-based auth (bcryptjs + express-session) |

### New DB Tables

`grants`, `subcontract_leads`, `prime_contractors`, `qa_flags`, `agent_logs`, `sent_emails`, `reddit_intel`, `opportunities`

Run migration after setting DATABASE_URL:
```bash
corepack pnpm --filter @workspace/db run push
```

### New Environment Variables

Add to `.env` (copy from `.env` in root — all keys present):

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ Hard-fail | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ Hard-fail | Express session signing key |
| `HUB_PASSWORD` | ✅ Hard-fail | Platform admin login password |
| `BRIEF_RECIPIENT` | ✅ Hard-fail | Email for daily brief (admin@greytaurus.com) |
| `ANTHROPIC_API_KEY` | ✅ Hard-fail | Claude API for QA agent |
| `IONOS_USER` | ✅ Hard-fail | IONOS SMTP username |
| `IONOS_PASSWORD` | ✅ Hard-fail | IONOS SMTP password |
| `SAM_API_KEY` | ⚠️ Warn-only | SAM.gov API key (scraper skips without it) |
| `GMAIL_USER` | ⚠️ Warn-only | Gmail fallback SMTP |
| `GMAIL_APP_PASSWORD` | ⚠️ Warn-only | Gmail app password |

### New API Routes

| Method | Path | Auth |
|---|---|---|
| GET | `/api/grants` | No |
| GET | `/api/subcontracts` | No |
| GET | `/api/reddit-intel` | No |
| PUT | `/api/reddit-intel/:id/action` | No |
| GET | `/api/qa-flags` | No |
| PUT | `/api/qa-flags/:id/resolve` | No |
| POST | `/api/email/send` | ✅ Session |
| POST | `/api/scan/run` | ✅ Session |
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | No |
| GET | `/api/auth/session` | No |

### Hub Frontend

```bash
cd artifacts/hub
corepack pnpm dev   # starts on port 5173
```

Set `VITE_API_URL` to point at the api-server if not running on same host.
Login at `/login` with username `admin` and your `HUB_PASSWORD`.

### Railway Deployment

`railway.json` is configured. Set all required env vars in Railway dashboard.
Start command: `node artifacts/api-server/dist/index.mjs`

## Grey Taurus LLC Static Website

A production-ready static website located at `grey-taurus/`. Pure HTML, CSS, and vanilla JavaScript — no frameworks, no build step.

### Files
- `grey-taurus/index.html` — Home page with hero, capabilities grid, why section, partnerships, CTA
- `grey-taurus/capabilities.html` — 8 numbered service items
- `grey-taurus/about.html` — Company overview with pull quote and approach block
- `grey-taurus/partnerships.html` — 5 partner-type sections
- `grey-taurus/contact.html` — Contact form with client-side validation
- `grey-taurus/css/style.css` — All styles (~17.5KB)
- `grey-taurus/js/main.js` — IntersectionObserver reveal, mobile nav, sticky header, page transitions, form validation (~5.4KB)

### Brand
- Background: #0f1117, Surface: #161b26, Gold accent: #c9a96e
- Font: Inter (Google Fonts CDN)
- Icons: Lucide via CDN
- Contact: admin@greytaurus.com
