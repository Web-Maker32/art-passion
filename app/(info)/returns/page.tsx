import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Returns and exchanges",
  description: "Draft returns and exchange information for Art Passion orders.",
};

export default function ReturnsPage() {
  // Draft page copy — confirm this policy against local consumer rules before launch.
  return (
    <InfoPage
      intro="We want you to be happy with your handmade order. If something is not right, please contact us so we can understand what happened."
      sections={[
        {
          heading: "Please contact us promptly",
          body: "Message us within 3 days of delivery and include your order details and clear photos of any damage or issue. We will review each situation and reply with next steps.",
        },
        {
          heading: "Custom and handmade items",
          body: "Because handmade and made-to-order items are prepared individually, return or exchange options may vary. Please contact us before sending anything back.",
        },
        {
          heading: "Resolution",
          body: "If an order arrives damaged or incorrect, we will work with you to find a fair resolution. This draft policy should be confirmed and updated before the store opens.",
        },
      ]}
      title="Returns and exchanges"
    />
  );
}
