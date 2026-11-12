import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

/**
 * Floating WhatsApp button. Icon-only circle at every width (52px tap target);
 * the "Chat with us" pill slides out on hover or keyboard focus on desktop
 * only. Interaction styles live in the whatsapp-float utilities in globals.css.
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
      aria-label="Chat on WhatsApp"
      className="whatsapp-float group bg-brand text-brand-foreground focus-visible:outline-ring fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex size-13 items-center justify-center rounded-full shadow-card ring-2 ring-brand-gold focus-visible:outline-2 focus-visible:outline-offset-2"
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
        className="whatsapp-float-label border-silver bg-card text-foreground pointer-events-none absolute right-full mr-3 hidden rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-card min-[640px]:block"
      >
        Chat with us
      </span>
      <MessageCircle
        aria-hidden="true"
        className="whatsapp-float-icon relative size-5"
      />
    </a>
  );
}