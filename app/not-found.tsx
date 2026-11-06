import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-20 text-center">
      <p className="text-gold-text text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-4 leading-7">
        The page you were looking for has moved or no longer exists.
      </p>
      <Link
        className="bg-brand text-brand-foreground focus-visible:outline-ring mt-8 inline-flex min-h-12 items-center justify-center rounded-md px-5 font-semibold lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2"
        href="/"
      >
        Back to the shop
      </Link>
    </div>
  );
}
