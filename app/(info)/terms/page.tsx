import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Draft terms for shopping with Art Passion.",
};

export default function TermsPage() {
  // Draft page copy — have this reviewed and update it to match local law and store operations.
  return (
    <InfoPage
      intro="These draft terms explain a few basics about browsing and ordering from Art Passion."
      sections={[
        {
          heading: "Product details",
          body: "Handmade products may have small variations in color, shape, or finish. We do our best to present product images and descriptions accurately.",
        },
        {
          heading: "Availability and pricing",
          body: "Product availability, variant options, and prices may change. An order is confirmed after we have reviewed the details with you and accepted it.",
        },
        {
          heading: "Contact and updates",
          body: "Please review our shipping and returns information and contact us with any questions before placing an order. These terms are a draft and need review before launch.",
        },
      ]}
      title="Terms of service"
    />
  );
}
