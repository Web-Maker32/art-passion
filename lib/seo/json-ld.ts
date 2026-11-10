import type { FaqItem } from "@/lib/content/faq";
import { isOwnerTodo, siteConfig } from "@/lib/site-config";
import { absoluteUrl } from "@/lib/seo/site-url";

/**
 * schema.org builders. Everything here is derived from data the shop already
 * has: no ratings, no review counts and no invented business details.
 */

export const SCHEMA_NEW_CONDITION = "https://schema.org/NewCondition";

export type ProductAvailability = "InStock" | "OutOfStock" | "LimitedAvailability";

type AvailabilityInput = {
  madeToOrder: boolean;
  variants: ReadonlyArray<{ stock: number }>;
};

/**
 * Availability from real stock only:
 * - nothing in stock and not made to order -> OutOfStock
 * - some variants sold out -> LimitedAvailability
 * - everything in stock (or made to order) -> InStock
 */
export function getProductAvailability(
  product: AvailabilityInput,
): ProductAvailability {
  const inStock = product.variants.filter((variant) => variant.stock > 0).length;

  if (inStock === 0) return product.madeToOrder ? "InStock" : "OutOfStock";
  if (inStock < product.variants.length) return "LimitedAvailability";
  return "InStock";
}

export function schemaAvailability(availability: ProductAvailability): string {
  return `https://schema.org/${availability}`;
}

/** Cuts long descriptions at a word boundary for structured data. */
export function trimDescription(value: string, maxLength = 300): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${trimmed.replace(/[.,;:!?-]+$/, "")}…`;
}

export type JsonLdObject = Record<string, unknown>;

/** Organization + Store for the home page. sameAs only lists real profiles. */
export function buildStoreJsonLd(): JsonLdObject {
  const siteUrl = absoluteUrl("/");
  const socialProfiles = [siteConfig.instagramUrl, siteConfig.facebookUrl].filter(
    (url) => !isOwnerTodo(url),
  );
  const hasEmail = !isOwnerTodo(siteConfig.contactEmail);
  const hasPhone = !isOwnerTodo(siteConfig.whatsappNumber);

  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: siteConfig.storeName,
    url: siteUrl,
    logo: absoluteUrl("/logo-badge.png"),
    image: absoluteUrl("/logo-badge.png"),
    description:
      "Handmade felt play sets, coloring kits, painting kits and gift sets, made by hand in Pakistan.",
    areaServed: { "@type": "Country", name: siteConfig.country },
    currenciesAccepted: "PKR",
    ...(socialProfiles.length > 0 ? { sameAs: socialProfiles } : {}),
    ...(hasEmail || hasPhone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            areaServed: "PK",
            ...(hasEmail ? { email: siteConfig.contactEmail } : {}),
            ...(hasPhone ? { telephone: `+${siteConfig.whatsappNumber}` } : {}),
          },
        }
      : {}),
  };
}

export type JsonLdProduct = {
  title: string;
  shortDescription: string | null;
  description: string;
  madeToOrder: boolean;
  category: { name: string };
  images: ReadonlyArray<{ url: string }>;
  variants: ReadonlyArray<{ sku: string | null; price: number; stock: number }>;
};

/** Product with an Offer, or an AggregateOffer when variant prices differ. */
export function buildProductJsonLd(
  product: JsonLdProduct,
  options: { url: string },
): JsonLdObject {
  const prices = product.variants.map((variant) => variant.price);
  const lowPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const highPrice = prices.length > 0 ? Math.max(...prices) : undefined;
  const availability = schemaAvailability(getProductAvailability(product));
  const sku = product.variants.find((variant) => variant.sku)?.sku ?? undefined;
  const description =
    product.shortDescription?.trim() || trimDescription(product.description);

  const offers =
    lowPrice === undefined || highPrice === undefined
      ? undefined
      : lowPrice === highPrice
        ? {
            "@type": "Offer",
            price: lowPrice,
            priceCurrency: "PKR",
            availability,
            itemCondition: SCHEMA_NEW_CONDITION,
            url: options.url,
          }
        : {
            "@type": "AggregateOffer",
            lowPrice,
            highPrice,
            priceCurrency: "PKR",
            offerCount: prices.length,
            availability,
            itemCondition: SCHEMA_NEW_CONDITION,
            url: options.url,
          };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description,
    ...(product.images.length > 0
      ? { image: product.images.map((image) => image.url) }
      : {}),
    ...(sku ? { sku } : {}),
    brand: { "@type": "Brand", name: siteConfig.storeName },
    category: product.category.name,
    url: options.url,
    ...(offers ? { offers } : {}),
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** FAQPage built from lib/content/faq.ts, skipping answers still marked TODO. */
export function buildFaqJsonLd(items: FaqItem[]): JsonLdObject {
  const answered = items.filter((item) => !item.answer.includes("TODO(owner)"));

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: answered.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
