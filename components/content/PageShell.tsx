import type { ReactNode } from "react";

/**
 * Shared shell for informational pages: consistent width, eyebrow, heading,
 * intro and vertical rhythm. Sections use the same heading tokens everywhere.
 */
export function PageShell({
  eyebrow = "Art Passion",
  title,
  intro,
  lastUpdated,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-gold-text text-sm font-semibold tracking-wide uppercase">
        {eyebrow}
      </p>
      <h1 className="font-heading text-foreground mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {intro ? (
        <p className="text-muted-foreground mt-4 text-lg leading-8">{intro}</p>
      ) : null}
      {lastUpdated ? (
        <p className="text-muted-foreground mt-3 text-sm">
          Last updated: {lastUpdated}
        </p>
      ) : null}
      <div className="mt-10 space-y-8">{children}</div>
    </article>
  );
}

export function PageSection({
  heading,
  children,
  id,
}: {
  heading: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section aria-labelledby={id} id={id}>
      <h2
        className="font-heading text-foreground text-xl font-semibold"
        id={id}
      >
        {heading}
      </h2>
      <div className="text-muted-foreground mt-2 space-y-3 leading-7">
        {children}
      </div>
    </section>
  );
}
