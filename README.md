This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses `next/font` to optimize and load Geist.

## Database

This project uses Prisma ORM with Neon PostgreSQL. Copy `.env.example` to `.env.local` and configure the pooled Neon connection string as `DATABASE_URL` and the direct connection string as `DIRECT_URL`. Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `WHATSAPP_NUMBER` as well.

Use `npm run db:migrate -- --name init` to create and apply a development migration, `npm run db:deploy` to apply migrations in production, `npm run db:seed` to create the initial data, and `npm run db:studio` to browse the database. Do not run the development migration command in production. The shared server-side Prisma client is available from `@/lib/db`.

Run `npm run db:generate` after changing the schema to regenerate Prisma Client. The seed script stores the admin password as a bcrypt hash, never as plaintext.

Run `npm test` for Vitest, `npm run typecheck` for TypeScript checks, and `npm run lint` for ESLint.

## Learn More

To learn more about Next.js, take a look at the [Next.js documentation](https://nextjs.org/docs).

## Deploy on Vercel

The easiest way to deploy this app is through the [Vercel Platform](https://vercel.com/new).

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
