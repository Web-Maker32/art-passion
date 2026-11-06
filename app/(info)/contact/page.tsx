import { Mail, MessageCircle } from "lucide-react";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { contactDetails } from "@/lib/content/faq";
import { contentMetadata } from "@/lib/content/metadata";
import { isOwnerTodo, siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = contentMetadata({
  title: "Contact Art Passion",
  description:
    "Ask about a handmade product, a gift, or an order. Contact Art Passion on WhatsApp, by email, or through social media.",
});

const buttonClass =
  "focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-brand px-5 font-semibold text-brand-foreground lift-sm press hover-fine:hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2";

const outlineButtonClass =
  "focus-visible:outline-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-silver px-5 font-semibold text-foreground lift-sm press hover-fine:hover:border-brand hover-fine:hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-offset-2";

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
      <PageSection heading="WhatsApp">
        <p>
          WhatsApp is the quickest way to reach the shop. Send a message with
          the product name or your order number, and add a photo if it helps.
        </p>
        {whatsapp ? (
          <a
            className={buttonClass}
            href={whatsapp}
            rel="noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden="true" className="size-5" />
            Message us on WhatsApp
          </a>
        ) : (
          <p className="border-silver rounded-lg border border-dashed p-4 text-sm">
            {siteConfig.whatsappNumber}
          </p>
        )}
      </PageSection>

      <PageSection heading="Email">
        <p>Prefer email? Write to us and we will reply when we can.</p>
        {hasEmail ? (
          <a className={outlineButtonClass} href={`mailto:${siteConfig.contactEmail}`}>
            <Mail aria-hidden="true" className="size-5" />
            {siteConfig.contactEmail}
          </a>
        ) : (
          <p className="border-silver rounded-lg border border-dashed p-4 text-sm">
            {siteConfig.contactEmail}
          </p>
        )}
      </PageSection>

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
                rel="noreferrer"
                target="_blank"
              >
                Instagram
              </a>
            )}
            {hasFacebook && (
              <a
                className={outlineButtonClass}
                href={siteConfig.facebookUrl}
                rel="noreferrer"
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
