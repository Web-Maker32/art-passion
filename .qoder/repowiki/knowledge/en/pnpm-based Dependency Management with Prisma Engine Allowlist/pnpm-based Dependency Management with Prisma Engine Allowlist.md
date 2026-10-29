---
kind: dependency_management
name: pnpm-based Dependency Management with Prisma Engine Allowlist
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - .gitignore
    - components.json
---

## System / Approach

The Art Passion storefront is a single-package Next.js project managed with **pnpm** (v12.3.4, declared via `packageManager` in `package.json`). Dependencies are declared in a flat `package.json` under `dependencies` and `devDependencies`, with a deterministic lockfile `pnpm-lock.yaml`. There is no monorepo workspace beyond the root package; `pnpm-workspace.yaml` exists only to configure build-time behavior for native binaries.

## Key Files

- `package.json` — sole manifest declaring all runtime and dev dependencies, scripts, and the `packageManager` field pinning pnpm version.
- `pnpm-lock.yaml` — generated lockfile ensuring reproducible installs.
- `pnpm-workspace.yaml` — allows selected native-build packages (`@prisma/engines`, `esbuild`, `prisma`) and explicitly disallows `sharp` and `unrs-resolver`.
- `.gitignore` — excludes `node_modules/` and `pnpm-lock.yaml` from version control (lockfile is committed per pnpm convention).
- `components.json` — shadcn/ui component registry mapping (`@/components`, `@/lib/utils`, etc.) that drives local aliasing rather than npm packages.

## Architecture & Conventions

- **Single dependency graph**: All third-party libraries live in one `package.json`; there are no nested `package.json` files or sub-packages.
- **Version ranges**: Most dependencies use caret ranges (`^x.y.z`), allowing minor/patch upgrades within the major version. A few are pinned exactly: `next` at `16.4.3`, `react`/`react-dom` at `19.3.0`, `eslint-config-next` at `16.4.3`, and `prisma` at `7.10.1`.
- **Postinstall hook**: `postinstall` runs `prisma generate`, so the Prisma client is regenerated on every install — this is the primary mechanism keeping the generated types in sync with `prisma/schema.prisma`.
- **Workspace allowlist**: `pnpm-workspace.yaml` uses `allowBuilds` to whitelist which packages may run native build steps during install. This is a security/performance guard against untrusted packages building native code.
- **No private registry**: No `.npmrc`, `.pnpmrc`, or `registry` settings were found in the repository. Packages are resolved from the default public registry.
- **No vendoring**: There is no `vendor/` directory or vendored copy of third-party source; all dependencies are installed into `node_modules`.
- **Local aliases over packages**: Internal module organization uses the `@/` path alias (configured in `tsconfig.json` and consumed by shadcn/ui via `components.json`) rather than internal npm packages.

## Conventions & Constraints

- The `packageManager` field pins pnpm to `12.3.4`, enforcing a specific toolchain across environments.
- Native builds are restricted: only `@prisma/engines`, `esbuild`, and `prisma` are permitted to execute build scripts; `sharp` and `unrs-resolver` are explicitly blocked via `allowBuilds` in `pnpm-workspace.yaml`.
- The Prisma client must be regenerated after any schema change via the `postinstall` hook (`prisma generate`); running `pnpm install` alone is insufficient to keep generated types current.
- Database operations go through the scripts in `package.json` (`db:migrate`, `db:push`, `db:deploy`, `db:seed`, `db:studio`) rather than direct CLI invocations, standardizing database workflow.