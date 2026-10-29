---
kind: configuration_system
name: Zod-Validated Environment Configuration with Prisma Dotenv Layering
category: configuration_system
scope:
    - '**'
source_files:
    - lib/env.ts
    - .env.example
    - prisma7.config.ts
    - next.config.ts
    - components.json
    - vitest.setup.ts
---

## Approach

The application uses a two-layer configuration system:

1. **Prisma-level config** (`prisma7.config.ts`) — loads `.env.local` via `dotenv.config({ path: [".env.local"] })` and reads `DIRECT_URL` from `process.env` for the Prisma datasource.
2. **Runtime app config** (`lib/env.ts`) — a single Zod schema that parses `process.env` into a strongly-typed, validated `env` object exported for the rest of the codebase.

There is no dedicated `config/` directory; all runtime configuration lives in `lib/env.ts`, with an example template at `.env.example`.

## Key Files

- `lib/env.ts` — Zod schema + parsed `env` export (the single source of truth for runtime env vars).
- `.env.example` — template listing every required/optional env var.
- `prisma7.config.ts` — Prisma CLI config loading `.env.local` and reading `DIRECT_URL`.
- `next.config.ts` — Next.js build/runtime config (image remote patterns, headers, turbopack rules).
- `components.json` — shadcn/ui component registry configuration.
- `vitest.setup.ts` — test-time defaults for env vars used by the Zod schema.

## Architecture & Conventions

### Centralized parsing
All environment variables are declared once in `lib/env.ts` inside a `z.object({...})` schema and then parsed via `envSchema.parse({ ... })`. Consumers import the resulting `env` object rather than reading `process.env` directly for business values.

### Schema-driven validation
Every field has an explicit Zod type:
- Required strings: `DATABASE_URL`, `CART_COOKIE_SECRET`, `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET`, `WALLET_TRANSFER_DETAILS`, `WHATSAPP_NUMBER` (with length/URL validators).
- Numeric with coercion and defaults: `SHIPPING_FLAT_RATE` defaults to `350`, `FREE_SHIPPING_THRESHOLD` defaults to `5000`.
- Optional URL: `NEXT_PUBLIC_SITE_URL` defaults to `http://localhost:3000`.

A missing or invalid value causes `parse()` to throw at startup, so misconfiguration fails fast.

### Secret handling
Secrets are plain environment variables (no vault integration): `CART_COOKIE_SECRET`, `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET`. They are validated to be ≥ 32 characters.

### Direct `process.env` usage outside the schema
Some modules bypass the central `env` object and read `process.env` directly:
- `lib/db.ts` reads `DATABASE_URL` directly.
- `lib/cart.ts`, `lib/order-access.ts`, `lib/admin-session.ts` read `process.env.CART_COOKIE_SECRET` / `process.env.NODE_ENV` directly.
- `prisma/seed.ts` and `scripts/set-admin-password.ts` read `process.env.DATABASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
- `vitest.setup.ts` sets fallback values for `DATABASE_URL`, `CART_COOKIE_SECRET`, `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET`, `WALLET_TRANSFER_DETAILS`, `WHATSAPP_NUMBER` using `??=`.

This means the Zod schema is not the sole access point for env vars — it is the documented contract, but several files still reach into `process.env` directly.

### Build vs runtime separation
`NEXT_PUBLIC_*` vars (e.g. `NEXT_PUBLIC_SITE_URL`) are intended for the client bundle and are declared alongside server-only vars in the same schema. There is no separate client-side env loader.

### Test configuration
Tests rely on `vitest.setup.ts` providing defaults for the secrets and connection string so the Zod schema can parse successfully during test runs.

## Conventions & Constraints

- **Single schema file**: All runtime configuration types live in `lib/env.ts`; new env vars should be added there first.
- **Validation-first**: Missing required env vars cause a parse error at module load time — this is enforced by Zod's `parse()` call.
- **Defaults for non-secret numbers**: Numeric settings use `z.coerce.number().default(...)` so they are optional at runtime.
- **Secret minimum length**: Secrets must be at least 32 characters, enforced by `z.string().min(32, ...)`.
- **Example template**: `.env.example` mirrors the schema fields and serves as the deployment checklist.
- **Prisma dotenv layering**: `prisma7.config.ts` explicitly loads `.env.local` before Prisma CLI commands run, so `DIRECT_URL` is available to migrations/seeding.
- **No feature flags or layered overrides**: The repo does not implement environment profiles (dev/staging/prod) beyond what the platform injects into `process.env`.
- **Next.js config is static**: `next.config.ts` contains only compile-time/static options; dynamic behavior is not driven by a config file.