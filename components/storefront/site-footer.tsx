import Link from "next/link";
import type { ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { Logo } from "@/components/logo";
import { storeCategories } from "@/lib/catalog";
import {
  deliveryInfoLine,
  isOwnerTodo,
  siteConfig,
} from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const helpLinks = [
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-and-returns", label: "Shipping and returns" },
  { href: "/payment-info", label: "Payment information" },
  { href: "/contact", label: "Contact" },
];

const companyLinks = [
  { href: "/about", label: "About us" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms" },
];

const copyrightYear = new Date().getFullYear();

export function SiteFooter() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message: "Hello Art Passion! I have a question about your handmade products.",
  });
  const shopLinks = [
    { href: "/products", label: "Shop all" },
    ...storeCategories.map(({ name, slug }) => ({
      href: `/categories/${slug}`,
      label: name,
    })),
  ];
  const hasInstagram = !isOwnerTodo(siteConfig.instagramUrl);
  const hasFacebook = !isOwnerTodo(siteConfig.facebookUrl);

  return (
    <footer className="border-brand-gold/40 bg-brand-deep text-brand-foreground relative z-30 mt-auto border-t pb-[88px]">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            aria-label={`${siteConfig.storeName} home`}
            className="focus-visible:outline-gold-light inline-flex items-center gap-4 rounded-sm p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/"
          >
            <Logo priority={false} size={96} variant="gold" />
            <span>
              <span className="font-brand-display text-brand-gold block text-2xl leading-none font-semibold">
                {siteConfig.storeName}
              </span>
              <span className="text-brand-foreground mt-1 block text-xs tracking-wide">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>
          <p className="text-brand-foreground/80 mt-3 max-w-xs text-sm">
            Thoughtful, handmade pieces and creative kits, packed by hand and
            sent from {siteConfig.country}.
          </p>
          <SocialLinks
            hasFacebook={hasFacebook}
            hasInstagram={hasInstagram}
            whatsapp={whatsapp}
          />
        </div>
        <FooterLinkList heading="Shop" links={shopLinks} />
        <FooterLinkList heading="Help" links={helpLinks} />
        <FooterLinkList heading="Company" links={companyLinks} />
      </Container>

      <div className="border-brand-gold/30 border-t">
        <Container className="text-brand-gold py-3 text-center text-sm font-medium">
          {deliveryInfoLine}
        </Container>
      </div>

      <div className="border-brand-gold/30 border-t">
        <Container className="text-brand-foreground/70 py-4 text-center text-sm">
          © {copyrightYear} {siteConfig.storeName}. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}

function SocialLinks({
  hasInstagram,
  hasFacebook,
  whatsapp,
}: {
  hasInstagram: boolean;
  hasFacebook: boolean;
  whatsapp: string | null;
}) {
  if (!hasInstagram && !hasFacebook && !whatsapp) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {hasInstagram && (
        <SocialLink
          href={siteConfig.instagramUrl}
          label={`${siteConfig.storeName} on Instagram`}
        >
          <InstagramIcon />
        </SocialLink>
      )}
      {hasFacebook && (
        <SocialLink
          href={siteConfig.facebookUrl}
          label={`${siteConfig.storeName} on Facebook`}
        >
          <FacebookIcon />
        </SocialLink>
      )}
      {whatsapp && (
        <SocialLink href={whatsapp} label={`Message ${siteConfig.storeName} on WhatsApp`}>
          <MessageCircle aria-hidden="true" className="size-5" />
        </SocialLink>
      )}
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      aria-label={label}
      className="text-brand-foreground/80 hover:text-brand-gold focus-visible:outline-gold-light inline-flex size-11 items-center justify-center rounded-md border border-white/15 transition-colors duration-interaction hover:border-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function FooterLinkList({
  heading,
  links,
}: {
  heading: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="font-heading text-base font-semibold">{heading}</h2>
      <ul className="mt-3 space-y-2">
        {links.map(({ href, label }) => (
          <li key={`${heading}-${href}`}>
            <Link
              className="text-brand-foreground/80 hover:text-brand-gold focus-visible:outline-gold-light text-sm underline-offset-4 transition-colors duration-interaction hover:underline hover:decoration-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2"
              href={href}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <rect height="18" rx="5" width="18" x="3" y="3" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" fill="currentColor" r="1" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M14.5 8.5H17V5h-2.8c-2.3 0-3.7 1.5-3.7 3.9V11H8v3.2h2.5V21h3.2v-6.8h2.6l.4-3.2h-3V9.2c0-.5.2-.7.8-.7Z" />
    </svg>
  );
}
