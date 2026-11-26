import { Mail, MessageCircle } from "lucide-react";
import { cn } from "cn";
import { isOwnerTodo, siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type ContactHelpProps = {
  message: string;
  whatsappNumber?: string;
  contactEmail?: string;
  heading?: string;
  className?: string;
};

export function ContactHelp({
  message,
  whatsappNumber = siteConfig.whatsappNumber,
  contactEmail = siteConfig.contactEmail,
  heading = "Need help?",
  className,
}: ContactHelpProps) {
  const cleanWhatsApp = whatsappNumber.trim();
  const whatsappHref =
    cleanWhatsApp && !isOwnerTodo(cleanWhatsApp)
      ? buildWhatsAppLink({ number: cleanWhatsApp, message })
      : null;

  const cleanEmail = contactEmail.trim();
  const emailHref =
    cleanEmail && !isOwnerTodo(cleanEmail) ? `mailto:${cleanEmail}` : null;

  if (!whatsappHref && !emailHref) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {heading && (
        <p className="text-foreground text-sm font-semibold">{heading}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {whatsappHref && (
          <a
            aria-label="Message us on WhatsApp (opens in a new tab)"
            className="border-silver bg-background text-foreground hover-fine:hover:bg-muted focus-visible:outline-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            href={whatsappHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MessageCircle
              aria-hidden="true"
              className="text-brand dark:text-gold-light size-4 shrink-0"
            />
            WhatsApp
          </a>
        )}
        {emailHref && (
          <a
            aria-label={`Email us at ${cleanEmail}`}
            className="border-silver bg-background text-foreground hover-fine:hover:bg-muted focus-visible:outline-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            href={emailHref}
            rel="noopener noreferrer"
          >
            <Mail
              aria-hidden="true"
              className="text-brand dark:text-gold-light size-4 shrink-0"
            />
            Email us
          </a>
        )}
      </div>
    </div>
  );
}
