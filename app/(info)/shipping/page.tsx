import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Shipping information",
  description: "Shipping information for Art Passion handmade orders in Pakistan.",
};

export default function ShippingPage() {
  // Draft page copy — replace estimates with confirmed carrier costs and timelines.
  return (
    <InfoPage
      intro="We pack every order with care and arrange delivery to the address you provide at checkout."
      sections={[
        {
          heading: "Preparation time",
          body: "Ready-to-ship items are prepared for dispatch as soon as possible. Made-to-order products need the preparation time shown on their product pages.",
        },
        {
          heading: "Delivery estimates",
          body: "Delivery timing and charges depend on your location and the courier service available. We will share the confirmed details before your order is dispatched.",
        },
        {
          heading: "Tracking and delivery help",
          body: "When tracking is available, we will share the tracking details with you. Please contact us if your parcel is delayed or arrives with an issue.",
        },
      ]}
      title="Shipping"
    />
  );
}
