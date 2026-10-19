import type { Metadata } from "next";
import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "About Art Passion",
  description: "The story behind Art Passion's handmade creations.",
};

export default function AboutPage() {
  // Draft page copy — personalize this story before publishing the shop.
  return (
    <InfoPage
      intro="Art Passion is a small, independent creative shop in Pakistan, making thoughtful pieces for play, making, and gifting."
      sections={[
        {
          heading: "Made slowly, with care",
          body: "Every felt set and creative kit starts with a love of color, texture, and the little details that make something feel special. We make in small batches and take care with every stitch and finishing touch.",
        },
        {
          heading: "For curious hands",
          body: "Our collection is designed to encourage imagination, joyful making, and meaningful moments together. Whether you are choosing a first art kit or a keepsake gift, we hope it brings a little delight.",
        },
        {
          heading: "Made in Pakistan",
          body: "Art Passion is proudly run from Pakistan. Thank you for supporting a small handmade business and the care that goes into each piece.",
        },
      ]}
      title="A little about us"
    />
  );
}
