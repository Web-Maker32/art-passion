import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact Art Passion",
  description: "Get in touch with Art Passion about handmade products and gifts.",
};

export default function ContactPage() {
  // Draft page copy — add the shop's preferred response times and social profiles.
  const whatsapp = buildWhatsAppLink({
    number: process.env.WHATSAPP_NUMBER,
    message: "Hello Art Passion! I have a question about your products.",
  });
  const email = process.env.CONTACT_EMAIL;
  const instagram = process.env.INSTAGRAM_URL;
  const facebook = process.env.FACEBOOK_URL;

  return (
    <div>
      <InfoPage
        intro="We would love to hear from you. Ask us about a product, a gift, or a handmade order."
        sections={[
          {
            heading: "WhatsApp",
            body: "For product questions and order enquiries, send us a message. We will get back to you as soon as we can.",
          },
          {
            heading: "Email",
            body: "Prefer email? You can write to us using the address below.",
          },
          {
            heading: "Follow along",
            body: "Visit our social pages for creative inspiration and a peek at what we are making.",
          },
        ]}
        title="Contact us"
      />
      <div className="mx-auto -mt-6 mb-12 flex max-w-3xl flex-wrap gap-3 px-4 sm:px-6">
        {whatsapp && (
          <a
            className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-semibold text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={whatsapp}
            rel="noreferrer"
            target="_blank"
          >
            Message us on WhatsApp
          </a>
        )}
        {email && (
          <a
            className="inline-flex min-h-11 items-center rounded-md border border-silver px-4 font-semibold text-brand hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={`mailto:${email}`}
          >
            {email}
          </a>
        )}
        {instagram && (
          <a
            className="inline-flex min-h-11 items-center rounded-md border border-silver px-4 font-semibold text-brand hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={instagram}
            rel="noreferrer"
            target="_blank"
          >
            Instagram
          </a>
        )}
        {facebook && (
          <a
            className="inline-flex min-h-11 items-center rounded-md border border-silver px-4 font-semibold text-brand hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={facebook}
            rel="noreferrer"
            target="_blank"
          >
            Facebook
          </a>
        )}
        {!whatsapp && !email && !instagram && !facebook && (
          <p className="text-sm text-muted-foreground">
            Contact options will be added soon.
          </p>
        )}
      </div>
    </div>
  );
}
