import { Home, MessageCircle, PackageOpen, Store } from "lucide-react";
import { CtaLink } from "@/components/content/cta";
import { siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function NotFound() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message: "Hello Art Passion! I need help finding something on your site.",
  });

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-20 text-center sm:px-6">
      <span className="bg-gold/20 text-gold-text dark:text-gold-light mx-auto inline-flex size-14 items-center justify-center rounded-2xl">
        <PackageOpen aria-hidden="true" className="size-6" />
      </span>
      <p className="text-gold-text mt-5 text-sm font-semibold tracking-wide uppercase">
        404
      </p>
      <h1 className="font-heading text-h1 mt-2 font-bold text-balance">
        Page not found
      </h1>
      <p className="text-muted-foreground mx-auto mt-4 max-w-md leading-7">
        The page you were looking for has moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <CtaLink href="/">
          <Home aria-hidden="true" className="size-4" />
          Go to home
        </CtaLink>
        <CtaLink href="/products" variant="outline">
          <Store aria-hidden="true" className="size-4" />
          Browse the shop
        </CtaLink>
      </div>
      {whatsapp ? (
        <a
          className="text-brand dark:text-gold-light focus-visible:outline-ring mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={whatsapp}
          rel="noopener noreferrer"
          target="_blank"
        >
          <MessageCircle aria-hidden="true" className="size-4" />
          Message us on WhatsApp
        </a>
      ) : null}
    </div>
  );
}