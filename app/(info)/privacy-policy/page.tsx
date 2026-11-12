import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Callout } from "@/components/content/callout";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { legalLastUpdated, legalReviewNote } from "@/lib/content/legal";
import { contentMetadata } from "@/lib/content/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = contentMetadata({
  title: "Privacy policy",
  description:
    "What information Art Passion collects when you place an order, why it is needed, how long it is kept, and how to ask about, correct or remove your details.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      intro="A short, plain-language explanation of what happens to the details you share with this shop."
      lastUpdated={legalLastUpdated}
      title="Privacy policy"
    >
      <Callout dashed>{legalReviewNote}</Callout>

      <PageSection heading="Who we are">
        <p>
          {siteConfig.storeName} is a small handmade shop based in{" "}
          {siteConfig.country}. One person runs the shop, answers messages and
          packs orders. The contact details are on the{" "}
          <Link className="text-brand dark:text-gold-light font-medium underline underline-offset-4" href="/contact">
            contact page
          </Link>
          .
        </p>
      </PageSection>

      <PageSection heading="Information we collect">
        <p>When you place an order or contact us, we may receive:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>your name and phone number;</li>
          <li>your email address, if you provide one;</li>
          <li>your delivery address and any delivery notes;</li>
          <li>the items you ordered, the order total and any gift note;</li>
          <li>messages, photos and payment screenshots you send us.</li>
        </ul>
      </PageSection>

      <PageSection heading="How we use it">
        <p>
          Your details are used to pack and deliver your order, to confirm your
          payment, to answer your questions, and to keep a simple record of what
          was sold. We do not use your details to send advertising unless you ask
          us to.
        </p>
      </PageSection>

      <PageSection heading="Who we share it with">
        <p>
          We share only what is needed to complete your order: your name, phone
          number and address go to the courier delivering the parcel. We do not
          sell your personal information.
        </p>
        <p>
          Our website uses hosting and database services to run the shop. Those
          providers process data on our behalf and are not allowed to use it for
          their own marketing.
        </p>
      </PageSection>

      <PageSection heading="Payment information">
        <p>
          Easypaisa payments are sent directly from your wallet to the shop
          account shown on the{" "}
          <Link
            className="text-brand dark:text-gold-light font-medium underline underline-offset-4"
            href="/payment-info"
          >
            payment information page
          </Link>
          .
        </p>
        <Callout icon={ShieldCheck} tone="warning">
          <p>
            We never ask for your Easypaisa PIN, password or one-time code, and
            you should never share them with anyone.
          </p>
        </Callout>
      </PageSection>

      <PageSection heading="Cookies">
        <p>
          The shop uses a small cookie so your cart is remembered while you
          browse. {"TODO(owner): confirm whether any analytics or advertising cookies are used, and name them here if so."}
        </p>
      </PageSection>

      <PageSection heading="How long we keep information">
        <p>
          {"TODO(owner): state how long order records are kept (for example, for accounting and warranty purposes) and when customer messages are deleted."}
        </p>
      </PageSection>

      <PageSection heading="Your choices">
        <p>
          You can ask what information we hold about you, ask for a correction,
          or ask us to delete details that we do not need to keep. Message us
          with your order number so the right record can be found.
        </p>
      </PageSection>

      <PageSection heading="Changes to this policy">
        <p>
          If this policy changes, the date at the top of the page is updated.
          Please check back before placing a new order if you are unsure.
        </p>
      </PageSection>
    </PageShell>
  );
}
