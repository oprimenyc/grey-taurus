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
