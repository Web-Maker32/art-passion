import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  Mail,
  MessageCircle,
  PackageSearch,
  Truck,
  Wallet,
} from "lucide-react";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { FacebookIcon, InstagramIcon } from "@/components/storefront/site-footer";
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

type Channel = {
  href: string;
  external?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
  primary?: boolean;
};

const cardBase =
  "focus-visible:outline-ring group flex h-full min-h-14 flex-col items-start rounded-2xl border p-5 lift-sm press focus-visible:outline-2 focus-visible:outline-offset-2";

const quickLinks = [
  { href: "/track-order", label: "Track my order", icon: PackageSearch },
  { href: "/shipping-and-returns", label: "Shipping and returns", icon: Truck },
  { href: "/payment-info", label: "Payment info", icon: Wallet },
  { href: "/faq", label: "FAQ", icon: CircleHelp },
] as const;

/** Show a readable address without inventing a handle: strip scheme and www. */
function displayAddress(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export default function ContactPage() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message: "Hello Art Passion! I have a question about your products.",
  });

  // Only channels with a real value are shown; TODO placeholders stay hidden.
  const channels: Channel[] = [];
  if (whatsapp) {
    channels.push({
      href: whatsapp,
      external: true,
      icon: MessageCircle,
      label: "WhatsApp",
      value: `+${siteConfig.whatsappNumber}`,
      note: "Fastest way to reach us",
      primary: true,
    });
  }
  if (!isOwnerTodo(siteConfig.contactEmail)) {
    channels.push({
      href: `mailto:${siteConfig.contactEmail}`,
      icon: Mail,
      label: "Email",
      value: siteConfig.contactEmail,
      note: "Prefer email? Write to us and we will reply when we can.",
    });
  }
  if (!isOwnerTodo(siteConfig.instagramUrl)) {
    channels.push({
      href: siteConfig.instagramUrl,
      external: true,
      icon: InstagramIcon,
      label: "Instagram",
      value: displayAddress(siteConfig.instagramUrl),
      note: "Where new pieces and works in progress are shared.",
    });
  }
  if (!isOwnerTodo(siteConfig.facebookUrl)) {
    channels.push({
      href: siteConfig.facebookUrl,
      external: true,
      icon: FacebookIcon,
      label: "Facebook",
      value: displayAddress(siteConfig.facebookUrl),
      note: "Where new pieces and works in progress are shared.",
    });
  }

  const hasCity = !isOwnerTodo(siteConfig.city);
  const hasResponseTime = !isOwnerTodo(contactDetails.responseTime);

  return (
    <PageShell
      intro="We would love to hear from you. Ask about a product, a gift, a custom idea, or an order you have already placed."
      title="Contact us"
    >
      {channels.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map(({ href, external, icon: Icon, label, value, note, primary }) => (
            <a
              className={`${cardBase} ${
                primary
                  ? "border-brand bg-brand text-brand-foreground hover-fine:hover:bg-brand-hover"
                  : "border-silver bg-card text-foreground shadow-soft hover-fine:hover:border-brand hover-fine:hover:bg-brand/5"
              }`}
              href={href}
              key={label}
              {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ${
                    primary
                      ? "bg-brand-foreground/15"
                      : "bg-gold/20 text-gold-text dark:text-gold-light"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className={`size-5 shrink-0 transition-transform duration-interaction ease-interaction motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none ${
                    primary ? "text-brand-foreground/80" : "text-muted-foreground"
                  }`}
                />
              </span>
              <span className="font-heading mt-4 block text-lg font-semibold">
                {label}
              </span>
              <span className="mt-1 block text-sm font-medium [overflow-wrap:anywhere]">
                {value}
              </span>
              <span
                className={`mt-auto block pt-3 text-sm leading-6 ${
                  primary ? "text-brand-foreground/85" : "text-muted-foreground"
                }`}
              >
                {note}
              </span>
            </a>
          ))}
        </div>
      )}

      <PageSection heading="Before you write" id="before-you-write">
        <p>
          Use your order number and checkout phone number to see its latest
          status.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              className="border-silver bg-card text-foreground lift-sm press hover-fine:hover:border-brand hover-fine:hover:bg-brand/5 focus-visible:outline-ring group flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 focus-visible:outline-2 focus-visible:outline-offset-2"
              href={href}
              key={href}
            >
              <span className="bg-brand/10 text-brand dark:bg-gold/15 dark:text-gold-light inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight
                aria-hidden="true"
                className="text-muted-foreground size-4 shrink-0 transition-transform duration-interaction ease-interaction motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
              />
            </Link>
          ))}
        </div>
      </PageSection>

      <PageSection heading="Response time">
        {hasResponseTime && <p>{contactDetails.responseTime}</p>}
        <p>
          Messages are answered by one person, so please allow a little extra
          time on busy days. If your question is about an existing order, include
          the order number so it can be found quickly.
        </p>
      </PageSection>

      <PageSection heading="Where we are">
        <p>
          {hasCity ? `${siteConfig.city}, ` : ""}
          {siteConfig.country}. Orders are delivered across Pakistan; see the
          delivery information before ordering.
        </p>
      </PageSection>
    </PageShell>
  );
}