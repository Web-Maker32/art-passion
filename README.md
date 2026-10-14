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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database

This project uses Prisma ORM with Neon PostgreSQL. Create a Neon database, copy `.env.example` to `.env`, and replace the sample values with the connection strings from Neon. Use the pooled connection string for `DATABASE_URL` and the direct connection string for `DIRECT_URL`.

Use `pnpm db:push` while prototyping the schema. For tracked schema changes, use `pnpm db:migrate` during development and `pnpm db:deploy` in production; do not run the development migration command in production. Run `pnpm db:generate` after changing the schema to regenerate Prisma Client. Import the shared server-side client from `@/lib/prisma`.

Run `pnpm test` for Vitest and `pnpm typecheck` for TypeScript checks. Add `prisma/seed.ts` and its Prisma config entry when the schema has seedable models.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
