"use client";

import Link from "next/link";
import { CircleAlert, RefreshCw } from "lucide-react";

/**
 * Shared error fallback. The storefront branch uses the brand design system;
 * the admin branch stays plain so /admin keeps its own look.
 */
export function ErrorPanel({ retry, admin = false }: { retry: () => void; admin?: boolean }) {
  if (admin) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16" role="alert">
        <h1 className="font-heading text-2xl font-bold">We couldn’t load this page</h1>
        <p className="mt-4">Please try again. If the problem continues, come back in a few minutes.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <button className="bg-primary text-primary-foreground press rounded-md px-4 py-2" onClick={retry} type="button">Try again</button>
          <a className="rounded-md border border-border px-4 py-2" href="/admin">Back to admin</a>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6"
      role="alert"
    >
      <span className="bg-gold/20 text-gold-text dark:text-gold-light mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
        <CircleAlert aria-hidden="true" className="size-6" />
      </span>
      <h1 className="font-heading mt-5 text-3xl font-bold text-balance">
        We couldn’t load this page
      </h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-md leading-7">
        Please try again. If the problem continues, come back in a few minutes.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          className="bg-brand text-brand-foreground lift-sm press hover-fine:hover:bg-brand-hover focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={retry}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Try again
        </button>
        <Link
          className="border-silver text-foreground lift-sm press hover-fine:hover:border-brand hover-fine:hover:bg-brand/5 focus-visible:outline-ring inline-flex min-h-12 items-center justify-center rounded-lg border px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
          href="/"
        >
          Back to the shop
        </Link>
      </div>
    </main>
  );
}