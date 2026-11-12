import { ArrowRight, Mail, MessageCircle } from "lucide-react";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { contactDetails } from "@/lib/content/faq";
import { contentMetadata } from "@/lib/content/metadata";
import { isOwnerTodo, siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = contentMetadata({
  title: "Contact us",
  description:
    "Questions about a handmade piece, an order or a gift? Message Art Passion on WhatsApp, send an email, or follow the shop on Instagram and Facebook anytime.",
  path: "/contact",
});

const cardBase =
  "focus-visible:outline-ring group flex min-h-14 items-center gap-4 rounded-2xl border p-5 lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2";

const outlineButtonClass =
  "focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-silver px-5 font-semibold text-foreground lift-sm press hover-fine:hover:border-brand hover-fine:hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2";

export default function ContactPage() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message: "Hello Art Passion! I have a question about your products.",
  });
  const hasEmail = !isOwnerTodo(siteConfig.contactEmail);
  const hasInstagram = !isOwnerTodo(siteConfig.instagramUrl);
  const hasFacebook = !isOwnerTodo(siteConfig.facebookUrl);

  return (
    <PageShell
      intro="We would love to hear from you. Ask about a product, a gift, a custom idea, or an order you have already placed."
      title="Contact us"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {whatsapp ? (
          <a
            className={`${cardBase} border-brand bg-brand text-brand-foreground hover-fine:hover:bg-brand-hover`}
            href={whatsapp}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="bg-brand-foreground/15 inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
              <MessageCircle aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-heading block text-lg font-semibold">
                Message us on WhatsApp
              </span>
              <span className="text-brand-foreground/85 mt-1 block text-sm leading-6">
                WhatsApp is the quickest way to reach the shop. Send a message
                with the product name or your order number, and add a photo if
                it helps.
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </a>
        ) : (
          <p className="border-silver text-muted-foreground rounded-2xl border border-dashed p-5 text-sm">
            {siteConfig.whatsappNumber}
          </p>
        )}

        {hasEmail ? (
          <a
            className={`${cardBase} border-silver bg-card text-foreground shadow-soft hover-fine:hover:border-brand`}
            href={`mailto:${siteConfig.contactEmail}`}
          >
            <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-11 shrink-0 items-center justify-center rounded-xl">
              <Mail aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-heading block text-lg font-semibold break-all">
                {siteConfig.contactEmail}
              </span>
              <span className="text-muted-foreground mt-1 block text-sm leading-6">
                Prefer email? Write to us and we will reply when we can.
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="text-muted-foreground size-5 shrink-0 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </a>
        ) : (
          <p className="border-silver text-muted-foreground rounded-2xl border border-dashed p-5 text-sm">
            {siteConfig.contactEmail}
          </p>
        )}
      </div>

      {(hasInstagram || hasFacebook) && (
        <PageSection heading="Follow along">
          <p>
            Social pages are where new pieces and works in progress are shared.
          </p>
          <div className="flex flex-wrap gap-3">
            {hasInstagram && (
              <a
                className={outlineButtonClass}
                href={siteConfig.instagramUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            )}
            {hasFacebook && (
              <a
                className={outlineButtonClass}
                href={siteConfig.facebookUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Facebook
              </a>
            )}
          </div>
        </PageSection>
      )}

      <PageSection heading="Response time">
        <p>{contactDetails.responseTime}</p>
        <p>
          Messages are answered by one person, so please allow a little extra
          time on busy days. If your question is about an existing order, include
          the order number so it can be found quickly.
        </p>
      </PageSection>

      <PageSection heading="Where we are">
        <p>
          {siteConfig.city}, {siteConfig.country}. Orders are delivered across
          Pakistan; see the delivery information before ordering.
        </p>
      </PageSection>
    </PageShell>
  );
}