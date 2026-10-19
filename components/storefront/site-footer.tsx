import Link from "next/link";
import { Container } from "@/components/storefront/container";
import { Logo } from "@/components/logo";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const quickLinks = [
  { href: "/products", label: "Shop all" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

const policyLinks = [
  { href: "/shipping", label: "Shipping" },
  { href: "/returns", label: "Returns" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

const copyrightYear = new Date().getFullYear();

export function SiteFooter() {
  const whatsapp = buildWhatsAppLink({
    number: process.env.WHATSAPP_NUMBER,
    message:
      "Hello Art Passion! I have a question about your handmade products.",
  });

  return (
    <footer className="border-brand-gold/40 bg-brand-deep text-brand-foreground relative z-30 mt-auto border-t pb-[88px]">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link
            aria-label="Art Passion home"
            className="focus-visible:outline-gold-light inline-flex items-center gap-4 rounded-sm p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/"
          >
            <Logo priority={false} size={96} variant="gold" />
            <span>
              <span className="font-brand-display text-brand-gold block text-2xl leading-none font-semibold">
                Art Passion
              </span>
              <span className="text-brand-foreground mt-1 block text-xs tracking-wide">
                the passion of art
              </span>
            </span>
          </Link>
          <p className="text-brand-foreground/80 mt-3 max-w-xs text-sm">
            Thoughtful, handmade pieces and creative kits, made with passion in
            Pakistan.
          </p>
          <p className="text-brand-gold mt-2 text-sm font-medium">
            Made with passion in Pakistan
          </p>
        </div>
        <FooterLinkList heading="Quick links" links={quickLinks} />
        <FooterLinkList heading="Policies" links={policyLinks} />
        <div>
          <h2 className="font-heading text-base font-semibold">Say hello</h2>
          <p className="text-brand-foreground/80 mt-2 text-sm">
            Questions about a piece or a custom order? We would love to hear
            from you.
          </p>
          {whatsapp ? (
            <a
              className="text-brand-foreground focus-visible:outline-gold-light mt-3 inline-flex rounded-sm font-medium underline-offset-4 hover:text-brand-gold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              href={whatsapp}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp us
            </a>
          ) : (
            <Link
              className="text-brand-foreground focus-visible:outline-gold-light mt-3 inline-flex rounded-sm font-medium underline-offset-4 hover:text-brand-gold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/contact"
            >
              Contact us
            </Link>
          )}
        </div>
      </Container>
      <div className="border-brand-gold/30 border-t">
        <Container className="text-brand-foreground/70 py-4 text-center text-sm">
          © {copyrightYear} Art Passion. All rights reserved.
        </Container>
      </div>
    </footer>
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
          <li key={label}>
            <Link
              className="text-brand-foreground/80 hover:text-brand-gold focus-visible:outline-gold-light text-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
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
