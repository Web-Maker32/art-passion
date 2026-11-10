"use client";

export function ErrorPanel({ retry, admin = false }: { retry: () => void; admin?: boolean }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-16" role="alert">
      <h1 className="font-heading text-2xl font-bold">We couldn’t load this page</h1>
      <p className="mt-4">Please try again. If the problem continues, come back in a few minutes.</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <button className="bg-primary text-primary-foreground press rounded-md px-4 py-2" onClick={retry} type="button">Try again</button>
        <a className="rounded-md border border-border px-4 py-2" href={admin ? "/admin" : "/"}>{admin ? "Back to admin" : "Back to the shop"}</a>
      </div>
    </main>
  );
}
