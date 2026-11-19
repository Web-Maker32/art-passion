import { describe, expect, it } from "vitest";
import { contentMetadata } from "@/lib/content/metadata";

describe("contentMetadata", () => {
  const metadata = contentMetadata({
    title: "Contact us",
    description: "Talk to Art Passion about orders and custom work.",
    path: "/contact",
  });

  it("publishes a page-specific canonical URL", () => {
    expect(metadata.alternates?.canonical).toBe("/contact");
  });

  it("carries the shared og:image on every info page", () => {
    const images = metadata.openGraph?.images;
    expect(images).toEqual([
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Art Passion - the passion of art",
      },
    ]);
  });

  it("uses the page title and description for openGraph", () => {
    expect(metadata.openGraph).toMatchObject({
      title: "Contact us | Art Passion",
      description: "Talk to Art Passion about orders and custom work.",
      url: "/contact",
      type: "website",
    });
  });

  it("emits a page-specific twitter card instead of inheriting the home one", () => {
    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "Contact us | Art Passion",
      description: "Talk to Art Passion about orders and custom work.",
      images: {
        url: "/og-image.png",
        alt: "Art Passion - the passion of art",
      },
    });
  });
});