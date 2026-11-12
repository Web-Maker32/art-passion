import { MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import { Callout } from "@/components/content/callout";
import { CtaLink } from "@/components/content/cta";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { contentMetadata } from "@/lib/content/metadata";
import { isOwnerTodo, siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = contentMetadata({
  title: "Payment information",
  description:
    "How to pay for an Art Passion order with an Easypaisa wallet transfer, what to send after paying, and how to arrange cash on delivery through WhatsApp.",
  path: "/payment-info",
});

export default function PaymentInfoPage() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message:
      "Hello Art Passion! I have sent my Easypaisa payment. My order number is: ",
  });

  const paymentDetails = [
    { label: "Account name", value: siteConfig.easypaisaAccountName },
    { label: "Easypaisa number", value: siteConfig.easypaisaNumber },
  ];

  const steps = [
    "Add your items to the cart and continue to checkout.",
    "Enter your delivery details and place the order. Easypaisa wallet transfer is the payment option at checkout.",
    "Note the order number and total shown on the confirmation page.",
    "Open the Easypaisa app and send the exact total to the account details below.",
    "Send us the payment screenshot on WhatsApp with your order number.",
    "The payment is checked by hand, and the order is marked as paid.",
  ];

  return (
    <PageShell
      intro="Online orders are paid by Easypaisa wallet transfer. Here is the whole process, step by step."
      title="Payment information"
    >
      <PageSection heading="How Easypaisa payment works">
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li className="flex items-start gap-4" key={step}>
              <span
                aria-hidden="true"
                className="bg-gold/20 text-gold-text dark:text-gold-light font-heading mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {index + 1}
              </span>
              <span className="leading-7">{step}</span>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection heading="Where to send the payment">
        <Callout icon={ShieldCheck} tone="warning">
          <p>
            Only use the account details shown on this page. If anything looks
            different, message us before sending money.
          </p>
        </Callout>
        <dl className="grid gap-3 sm:grid-cols-2">
          {paymentDetails.map(({ label, value }) => (
            <div
              className={`rounded-xl border p-4 ${
                isOwnerTodo(value)
                  ? "border-silver border-dashed"
                  : "border-silver bg-card shadow-soft"
              }`}
              key={label}
            >
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
                <Wallet
                  aria-hidden="true"
                  className="text-gold-text dark:text-gold-light size-4"
                />
                {label}
              </dt>
              <dd className="text-foreground mt-1.5 font-semibold break-words">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </PageSection>

      <PageSection heading="After you have paid">
        <p>
          Send the screenshot with your order number as soon as you can, so the
          payment can be matched to the right order. Keep the Easypaisa receipt
          until your parcel arrives.
        </p>
        {whatsapp ? (
          <CtaLink href={whatsapp} variant="outline">
            <MessageCircle aria-hidden="true" className="size-5" />
            Send payment details on WhatsApp
          </CtaLink>
        ) : (
          <CtaLink href="/contact" variant="outline">
            Contact us
          </CtaLink>
        )}
      </PageSection>

      <PageSection heading="Cash on delivery">
        <p>
          Cash on delivery is not a checkout option. It can be arranged
          separately by messaging us on WhatsApp before you order, and we will
          confirm whether it is possible for your address.
        </p>
      </PageSection>

      <PageSection heading="If a payment does not go through">
        <Callout tone="warning">
          <p>
            Do not send the payment twice. Message us with your order number and
            what you see in the Easypaisa app, and we will check the order before
            you try again.
          </p>
        </Callout>
        <p>
          Orders are only marked as paid after the payment has been checked, so a
          short delay between sending and confirming is normal.
        </p>
      </PageSection>
    </PageShell>
  );
}
