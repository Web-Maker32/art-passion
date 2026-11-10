import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildProductJsonLd,
  buildStoreJsonLd,
  getProductAvailability,
  trimDescription,
} from "@/lib/seo/json-ld";

const baseProduct = {
  title: "Sample: Woodland Friends Felt Play Set",
  shortDescription: null,
  description:
    "A soft felt play set with hand-stitched animals, a little pond and a carry pouch for quiet play at home.",
  madeToOrder: false,
  category: { name: "Felt Play Sets" },
  images: [
    { url: "https://res.cloudinary.com/art-passion/image/upload/v1/felt.jpg" },
    { url: "https://res.cloudinary.com/art-passion/image/upload/v1/felt-2.jpg" },
  ],
  variants: [
    { sku: "AP-FELT-01", price: 3900, stock: 4 },
    { sku: "AP-FELT-02", price: 4500, stock: 2 },
  ],
};

describe("product JSON-LD", () => {
  it("uses rupee prices, PKR and the product URL for a single price", () => {
    const jsonLd = buildProductJsonLd(
      { ...baseProduct, variants: [{ sku: "AP-FELT-01", price: 4250, stock: 3 }] },
      { url: "https://artpassion.pk/products/woodland-friends-felt-set" },
    );

    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe(baseProduct.title);
    expect(jsonLd.sku).toBe("AP-FELT-01");
    expect(jsonLd.image).toEqual([
      "https://res.cloudinary.com/art-passion/image/upload/v1/felt.jpg",
      "https://res.cloudinary.com/art-passion/image/upload/v1/felt-2.jpg",
    ]);
    expect(jsonLd.offers).toEqual({
      "@type": "Offer",
      price: 4250,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: "https://artpassion.pk/products/woodland-friends-felt-set",
    });
  });

  it("uses an AggregateOffer when variant prices differ", () => {
    const jsonLd = buildProductJsonLd(baseProduct, {
      url: "https://artpassion.pk/products/woodland-friends-felt-set",
    });

    expect(jsonLd.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 3900,
      highPrice: 4500,
      priceCurrency: "PKR",
      offerCount: 2,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    });
  });

  it("never publishes ratings or reviews", () => {
    const jsonLd = buildProductJsonLd(baseProduct, { url: "https://example.test" });

    expect(jsonLd).not.toHaveProperty("aggregateRating");
    expect(jsonLd).not.toHaveProperty("review");
    expect(JSON.stringify(jsonLd)).not.toMatch(/rating|review/i);
  });

  it("reports availability from real stock", () => {
    expect(
      getProductAvailability({
        madeToOrder: false,
        variants: [{ stock: 0 }, { stock: 0 }],
      }),
    ).toBe("OutOfStock");
    expect(
      getProductAvailability({ madeToOrder: false, variants: [{ stock: 0 }, { stock: 2 }] }),
    ).toBe("LimitedAvailability");
    expect(
      getProductAvailability({ madeToOrder: true, variants: [{ stock: 0 }] }),
    ).toBe("InStock");
    expect(getProductAvailability({ madeToOrder: false, variants: [] })).toBe(
      "OutOfStock",
    );

    const outOfStock = buildProductJsonLd(
      { ...baseProduct, variants: [{ sku: null, price: 3900, stock: 0 }] },
      { url: "https://example.test" },
    );
    expect(outOfStock.offers).toMatchObject({
      availability: "https://schema.org/OutOfStock",
    });
  });

  it("prefers shortDescription and falls back to a trimmed description", () => {
    const withShort = buildProductJsonLd(
      { ...baseProduct, shortDescription: "Soft felt animals for quiet play." },
      { url: "https://example.test" },
    );
    expect(withShort.description).toBe("Soft felt animals for quiet play.");

    const long = buildProductJsonLd(
      { ...baseProduct, description: "word ".repeat(120) },
      { url: "https://example.test" },
    );
    expect((long.description as string).length).toBeLessThanOrEqual(301);
    expect(trimDescription("short text")).toBe("short text");
  });
});

describe("store JSON-LD", () => {
  it("describes the shop with absolute URLs and no invented reviews", () => {
    const jsonLd = buildStoreJsonLd();

    expect(jsonLd["@type"]).toBe("Store");
    expect(jsonLd.name).toBe("Art Passion");
    expect(jsonLd.url).toBe("http://localhost:3000");
    expect(jsonLd.logo).toBe("http://localhost:3000/logo-badge.png");
    expect(jsonLd.areaServed).toEqual({ "@type": "Country", name: "Pakistan" });
    expect(jsonLd).not.toHaveProperty("aggregateRating");
  });

  it("only lists contact details that are actually configured", () => {
    const jsonLd = buildStoreJsonLd();
    const contactPoint = jsonLd.contactPoint as Record<string, unknown>;

    // Tests configure WHATSAPP_NUMBER but not CONTACT_EMAIL.
    expect(contactPoint.telephone).toBe("+923001234567");
    expect(contactPoint).not.toHaveProperty("email");
    expect(jsonLd).not.toHaveProperty("sameAs");
  });
});

describe("breadcrumb and FAQ JSON-LD", () => {
  it("numbers breadcrumb items and builds absolute URLs", () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Shop", path: "/products" },
      { name: "Felt Play Sets", path: "/categories/felt-sets" },
    ]);

    expect(jsonLd.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "http://localhost:3000" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: "http://localhost:3000/products",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Felt Play Sets",
        item: "http://localhost:3000/categories/felt-sets",
      },
    ]);
  });

  it("skips FAQ answers that still contain owner placeholders", () => {
    const jsonLd = buildFaqJsonLd([
      { question: "How do I order?", answer: "Add to cart and check out." },
      { question: "Gift wrapping?", answer: "TODO(owner): confirm this." },
    ]);

    const questions = jsonLd.mainEntity as Array<Record<string, unknown>>;
    expect(questions).toHaveLength(1);
    expect(questions[0].name).toBe("How do I order?");
    expect(JSON.stringify(jsonLd)).not.toContain("TODO(owner)");
  });
});
