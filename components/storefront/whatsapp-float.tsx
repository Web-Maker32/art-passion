import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

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
      className="bg-brand text-brand-foreground hover:bg-brand-hover focus-visible:outline-ring fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 inline-flex size-12 items-center justify-center rounded-full p-0 font-semibold shadow-md shadow-black/20 ring-2 ring-brand-gold transition-[transform,box-shadow,background-color] duration-interaction ease-interaction motion-safe:hover:scale-105 hover:shadow-card-hover press focus-visible:outline-2 focus-visible:outline-offset-2 min-[640px]:size-auto min-[640px]:min-h-12 min-[640px]:gap-2 min-[640px]:px-4 min-[640px]:py-3"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircle aria-hidden="true" className="size-5" />
      <span className="sr-only min-[640px]:not-sr-only">Chat on WhatsApp</span>
    </a>
  );
}
