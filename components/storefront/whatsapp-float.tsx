"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

/**
 * A fixed-size "Message us" pill: one clean surface, no growth on hover.
 * It stays off the cart, checkout and product pages — those carry their own
 * WhatsApp buttons, so the float can never sit over a purchase control — and
 * off contact/track-order, whose primary actions sit in the float's corner on
 * small screens. The link is built on the server (the number is not a public
 * env var) and passed in; interaction styles live in the whatsapp-float
 * utilities.
 */
export function WhatsAppFloat({ href }: { href: string | null }) {
  const pathname = usePathname();

  if (!href) return null;
  if (
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname === "/contact" ||
    pathname === "/track-order" ||
    pathname.startsWith("/products/")
  ) {
    return null;
  }

  return (
    <a
      aria-label="Message us on WhatsApp"
      className="whatsapp-float group bg-brand text-brand-foreground focus-visible:outline-ring shadow-card ring-brand-gold fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex h-12 items-center gap-2 rounded-full px-4 font-sans ring-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span
        aria-hidden="true"
        className="whatsapp-float-pulse absolute inset-0 rounded-full"
      />
      <MessageCircle
        aria-hidden="true"
        className="whatsapp-float-icon relative size-5 shrink-0"
      />
      <span className="relative text-sm leading-none font-medium whitespace-nowrap">
        Message us
      </span>
    </a>
  );
}
