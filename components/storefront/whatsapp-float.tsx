import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

/**
 * A 48px WhatsApp pill with an expanding desktop label. The right edge stays
 * fixed while the label reveals on hover or keyboard focus. Interaction
 * styles live in the whatsapp-float utilities in globals.css.
 */
export function WhatsAppFloat() {
  const href = buildWhatsAppLink({
    number: process.env.WHATSAPP_NUMBER,
    message:
      "Hello Art Passion! I would like to know more about your handmade products.",
  });

  if (!href) return null;

  return (
    <a
      aria-label="Message us on WhatsApp"
      className="whatsapp-float group bg-brand text-brand-foreground focus-visible:outline-ring fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex h-12 items-center rounded-full font-sans shadow-card ring-2 ring-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      <span
        aria-hidden="true"
        className="whatsapp-float-pulse absolute inset-0 rounded-full"
      />
      <span
        aria-hidden="true"
        className="whatsapp-float-label pointer-events-none overflow-hidden text-sm leading-none font-medium whitespace-nowrap"
      >
        <span className="block w-max pl-4">Message us</span>
      </span>
      <span aria-hidden="true" className="relative flex size-12 shrink-0 items-center justify-center">
        <MessageCircle className="whatsapp-float-icon size-5" />
      </span>
    </a>
  );
}