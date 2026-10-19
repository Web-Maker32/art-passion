import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers to common questions about Art Passion products and orders.",
};

export default function FaqPage() {
  // Draft page copy — review answers and add store-specific details before launch.
  return (
    <InfoPage
      intro="A few helpful answers about choosing, caring for, and ordering handmade pieces."
      sections={[
        {
          heading: "Are your products handmade?",
          body: "Yes. Our felt pieces and gift items are made by hand in small batches. Each one may have tiny differences that make it uniquely yours.",
        },
        {
          heading: "How long does a made-to-order item take?",
          body: "The product page shows the estimated preparation time. Please message us before ordering if you need an item by a particular date.",
        },
        {
          heading: "Can I ask for a custom gift?",
          body: "We are happy to discuss ideas and availability. Send us a message on WhatsApp and we can talk through what may be possible.",
        },
        {
          heading: "How can I get help with an order?",
          body: "Visit our Contact page and message us on WhatsApp or email. Please include your order details if you already placed an order.",
        },
      ]}
      title="Frequently asked questions"
    />
  );
}
