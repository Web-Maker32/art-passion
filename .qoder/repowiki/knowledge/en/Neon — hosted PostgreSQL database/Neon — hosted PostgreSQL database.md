---
kind: external_dependency
name: Neon — hosted PostgreSQL database
slug: neon
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

PostgreSQL backend accessed via Prisma with `@prisma/adapter-neon` and `@neondatabase/serverless`. Requires two connection strings in `.env.local`: pooled `DATABASE_URL` and direct `DIRECT_URL` (the latter is used by the seed script). The schema declares a `postgresql` datasource; no local DB is expected.