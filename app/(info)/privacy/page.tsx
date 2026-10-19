import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Draft privacy information for Art Passion customers.",
};

export default function PrivacyPage() {
  // Draft page copy — have this reviewed and update it to reflect actual data practices.
  return (
    <InfoPage
      intro="We respect your privacy and use the information you share only to help provide and improve your shopping experience."
      sections={[
        {
          heading: "Information you provide",
          body: "When you contact us or place an order, we may receive details such as your name, contact information, and delivery address. We use those details to respond to you and fulfil your order.",
        },
        {
          heading: "How information is handled",
          body: "We do not sell your personal information. Some information may be shared with delivery or technology providers when needed to complete a service you request.",
        },
        {
          heading: "Questions or requests",
          body: "Contact us if you have a question about your personal information or want to ask us to update or remove details where applicable.",
        },
      ]}
      title="Privacy policy"
    />
  );
}
