# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # API (port 3000) + App (port 5173) in parallel
pnpm dev:api          # API only
pnpm dev:app          # App only

# Build & start
pnpm build            # Build both packages
pnpm start:api        # Run compiled API
pnpm start:app        # Run compiled App (vite preview)

# Code quality
pnpm lint             # ESLint on both packages
pnpm lint:fix         # ESLint with --fix
pnpm format           # Prettier on both packages

# Database
pnpm prisma:generate  # Regenerate Prisma Client after schema changes
pnpm prisma:migrate   # Run migrations against Supabase (prompts for migration name)
pnpm prisma:seed      # Seed with SEED_USER_ID=<uuid> pnpm prisma:seed
```

API dev server uses `tsx watch` (no build step needed). App uses Vite HMR.

## Architecture

### Monorepo layout

- `packages/racional-api/` — Express REST API (TypeScript, Prisma, Supabase, Finnhub)
- `packages/racional-app/` — React SPA (Vite, TanStack Query v5, Tailwind, Firebase Firestore)

### API — Clean / Screaming Architecture

Each domain (`users`, `portfolios`, `transactions`, `orders`, `stocks`, `movements`) follows three layers:

```
<domain>/
  domain/          # Entities + repository interfaces (zero external deps)
  application/     # Use cases + DTOs (depend only on domain interfaces)
  infrastructure/  # Prisma repositories + Express routers (depend on everything)
```

`shared/` contains cross-cutting infrastructure: Prisma client singleton, Supabase auth middleware, Finnhub HTTP client, error types, and the global error-handler middleware.

Use cases receive repository interfaces via constructor injection; routers wire the concrete Prisma implementations. Adding a feature means adding a new use case — existing use cases are never modified.

### API — Key patterns

- **Decimal arithmetic**: All monetary/quantity values use `decimal.js`. Stored as `DECIMAL(18,6)` in Postgres. Serialized as `string` in JSON responses to preserve precision.
- **`portfolio_holdings` denormalized cache**: Updated atomically inside `prisma.$transaction` with every BUY/SELL order. `PlaceOrderUseCase` is the single writer. The cache enables O(holdings) portfolio total calculation.
- **Weighted average cost formula**: `new_avg = (old_avg × old_qty + price × qty) / (old_qty + qty)`.
- **Cursor pagination** (by `date DESC`) for the movements feed — avoids offset inconsistencies with live data.
- **Error hierarchy**: `AppError` base → `BusinessError` (422), `NotFoundError` (404), `UnauthorizedError` (401), `ValidationError` (400). The global error-handler middleware maps these to HTTP responses.
- **Swagger**: Auto-generated from JSDoc comments. Live at `http://localhost:3000/api/docs`.

### App — Structure

Feature folders mirror the API's domain language: `auth/`, `dashboard/`, `portfolio/`, `transactions/`, `evolution/`, `profile/`.

- `lib/api-client.ts` — Axios instance; attaches Supabase JWT as `Authorization: Bearer` header.
- `lib/supabase.ts` — Supabase client (env-driven).
- `lib/firebase.ts` — Firebase/Firestore client (hardcoded config for the shared `racional-exam` project).
- Data fetching uses TanStack Query v5 custom hooks (e.g., `usePortfolios`, `usePortfolioTotal`, `useMovements`).
- Real-time evolution chart (`EvolutionPage`) subscribes to Firestore document `investmentEvolutions/user1` via `onSnapshot`.

### Auth flow

Supabase handles authentication. The API's `auth.middleware.ts` validates the JWT using `@supabase/supabase-js` and attaches `req.user`. All API endpoints require this header.

## Environment variables

**`packages/racional-api/.env`**
```
DATABASE_URL        # Supabase pooled connection (pgbouncer)
DIRECT_URL          # Supabase direct connection (for migrations)
SUPABASE_URL
SUPABASE_ANON_KEY
FINNHUB_API_KEY
PORT                # default 3000
CORS_ORIGIN         # default http://localhost:5173
```

**`packages/racional-app/.env`**
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL        # default http://localhost:3000
```

## Pre-commit hook

Husky runs `lint-staged` on commit: ESLint + Prettier on all staged `.ts`/`.tsx` files under `packages/*/src/`.
