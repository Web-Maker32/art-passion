---
kind: build_system
name: pnpm + Next.js Build, Prisma Migrations & Vitest Test Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - vitest.config.mts
    - vitest.setup.ts
    - prisma7.config.ts
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - eslint.config.mjs
    - .prettierrc.json
    - tsconfig.json
---

## What system/approach is used

The project uses a standard modern Next.js (App Router) build pipeline with no custom Makefile or Dockerfile:

- **Package manager**: pnpm 12.3.4 (declared via `packageManager` in `package.json`, lockfile `pnpm-lock.yaml`, and workspace file `pnpm-workspace.yaml`).
- **Runtime / bundler**: Next.js 16.4.3 (`next dev`, `next build`, `next start`) with Turbopack enabled for CSS via `@tailwindcss/turbopack`.
- **Database tooling**: Prisma 7.10.1 with the Neon adapter (`@prisma/adapter-neon`) against PostgreSQL; migrations live under `prisma/migrations/`.
- **Testing**: Vitest 5.x configured with jsdom environment and React plugin.
- **Linting/formatting**: ESLint 9 (`eslint.config.mjs`) with `eslint-config-next`; Prettier 3 with Tailwind plugin.
- **Type checking**: TypeScript 5.9 via `tsc --noEmit` exposed as `pnpm typecheck`.

There is no CI configuration, no Dockerfile, no Makefile, and no cross-compile step in this repository — deployment is intended to be done through Next.js's own build output (`.next/`).

## Key files and packages

- `package.json` — all npm scripts, dependency versions, and the `postinstall` hook that runs `prisma generate`.
- `next.config.ts` — Next.js build config: enables `cacheComponents`, `partialPrefetching`, experimental `agentUpgrade: "security"`, Cloudinary/placeholder image allowlist, security headers on `/order/*`, and Turbopack CSS loader.
- `vitest.config.mts` + `vitest.setup.ts` — test runner setup (jsdom env, `@` alias pointing at repo root).
- `prisma7.config.ts` — Prisma v7 config loading `.env.local`, schema path `prisma/schema.prisma`, migration dir `prisma/migrations`, seed via `tsx prisma/seed.ts`, datasource URL from `DIRECT_URL`.
- `components.json` — shadcn/ui component registry config.
- `eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json` — code quality and TS compilation settings.
- `pnpm-workspace.yaml` — declares a pnpm workspace (though only one package exists at the root).

## Architecture and conventions

### Scripts surface the full lifecycle

`package.json` exposes a flat set of scripts covering every phase:

| Phase | Script | Command |
|---|---|---|
| Development | `dev` | `next dev` |
| Build | `build` | `next build` |
| Production run | `start` | `next start` |
| Lint | `lint` | `eslint` |
| Type check | `typecheck` | `tsc --noEmit` |
| Test | `test` | `vitest run` |
| DB generate client | `db:generate` | `prisma generate` |
| DB push schema | `db:push` | `prisma db push` |
| DB migrate (dev) | `db:migrate` | `prisma migrate dev` |
| DB migrate (prod) | `db:deploy` | `prisma migrate deploy` |
| Seed DB | `db:seed` | `tsx prisma/seed.ts` |
| Set admin password | `db:set-admin-password` | `tsx scripts/set-admin-password.ts` |
| DB Studio | `db:studio` | `prisma studio` |

### Postinstall auto-generates Prisma client

The `postinstall` script runs `prisma generate`, so the generated Prisma client is produced automatically after `pnpm install`. This means the build cannot proceed without a valid Prisma schema and database connection string present during install.

### Prisma v7 configuration

Prisma v7 uses a separate `prisma7.config.ts` (rather than inline `prisma.schema` in `package.json`). It reads `DIRECT_URL` from `.env.local` and points at `prisma/schema.prisma` with migrations under `prisma/migrations/`. The seed command is registered both here and under the `prisma.seed` field in `package.json`.

### Next.js build customization

`next.config.ts` is minimal but sets important build-time behavior:
- `cacheComponents: true` and `partialPrefetching: true` enable Next.js caching optimizations.
- Experimental `agentUpgrade: "security"` upgrades Node fetch agents for security.
- Image optimization is restricted to `res.cloudinary.com` and `placehold.co` via `remotePatterns`.
- Security headers (`Referrer-Policy: no-referrer`, `Cache-Control: no-store`) are forced on `/order/:orderNumber*` routes.
- Turbopack is configured to use `@tailwindcss/turbopack` for `*.css` files.

### Testing setup

Vitest is configured with jsdom as the test environment, a shared setup file (`vitest.setup.ts`), and an `@` path alias resolving to the repo root. Tests follow the `*.test.{ts,tsx}` naming convention and are discovered by the glob `**/*.{test,spec}.{ts,tsx}`.

### No containerization or CI

There is no `Dockerfile`, no GitHub Actions/GitLab CI/YAML pipelines, no Makefile, and no release automation in the repository. The expected deployment flow is therefore: install dependencies → generate Prisma client → build with `next build` → serve with `next start` (or deploy the `.next/` output to a Next.js-compatible host such as Vercel).

## Conventions and constraints

- **Dependency management**: All dependencies are pinned by caret ranges in `package.json` and locked by `pnpm-lock.yaml`; `pnpm@12.3.4` is enforced via the `packageManager` field.
- **Prisma client generation**: Running `pnpm install` always triggers `prisma generate` via `postinstall`; consuming code depends on the generated client being present.
- **Environment variables**: Prisma reads `DIRECT_URL` from `.env.local` (via `dotenv` in `prisma7.config.ts`); other runtime secrets are expected to be provided by the hosting platform.
- **Build target**: The production artifact is the Next.js build output (`.next/`); there is no custom bundling step beyond `next build`.
- **Test discovery**: Only files matching `**/*.{test,spec}.{ts,tsx}` are picked up by Vitest.
- **Path alias**: The `@` alias resolves to the repository root in both Next.js and Vitest contexts.