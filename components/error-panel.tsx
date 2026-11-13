"use client";

import Link from "next/link";
import { CircleAlert, RefreshCw } from "lucide-react";

/**
 * Shared error fallback. The storefront branch uses the brand design system;
 * the admin branch stays plain so /admin keeps its own look.
 */
export function ErrorPanel({
  retry,
  admin = false,
}: {
  retry: () => void;
  admin?: boolean;
}) {
  if (admin) {
    return (
      <main
        className="bg-background flex min-h-dvh items-center justify-center px-4 py-16"
        role="alert"
      >
        <div className="border-silver bg-card shadow-card w-full max-w-md rounded-2xl border p-6 text-center sm:p-8">
          <span className="bg-destructive/10 text-destructive mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
            <CircleAlert aria-hidden="true" className="size-6" />
          </span>
          <h1 className="font-heading mt-5 text-2xl font-bold text-balance">
            We couldn’t load this page
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-6">
            Please try again. If the problem continues, come back in a few
            minutes.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              className="bg-brand text-brand-foreground lift-sm press hover-fine:hover:bg-brand-hover focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              onClick={retry}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Try again
            </button>
            <a
              className="border-silver text-foreground lift-sm press hover-fine:hover:border-brand hover-fine:hover:bg-brand/5 focus-visible:outline-ring inline-flex min-h-12 items-center justify-center rounded-lg border px-5 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/admin"
            >
              Back to admin
            </a>
          </div>
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
