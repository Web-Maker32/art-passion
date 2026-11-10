import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/components/seo/JsonLd";
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";
import robots from "@/app/robots";

describe("serializeJsonLd", () => {
  it("escapes < so data cannot close the script tag", () => {
    const html = serializeJsonLd({
      name: "Felt set </script><script>alert(1)</script>",
    });

    expect(html).not.toContain("<");
    expect(html).toContain("\\u003c");
    expect(JSON.parse(html)).toEqual({
      name: "Felt set </script><script>alert(1)</script>",
    });
  });
});

describe("sitemap entries", () => {
  const entries = buildSitemapEntries({
    categories: [{ slug: "felt-sets" }, { slug: "gift-sets" }],
    products: [
      {
        slug: "woodland-friends-felt-set",
        updatedAt: new Date("2026-11-05T10:00:00.000Z"),
      },
    ],
  });
  const urls = entries.map((entry) => entry.url);

  it("includes the core pages, categories and published products", () => {
    expect(urls).toContain("http://localhost:3000");
    expect(urls).toContain("http://localhost:3000/products");
    expect(urls).toContain("http://localhost:3000/about");
    expect(urls).toContain("http://localhost:3000/contact");
    expect(urls).toContain("http://localhost:3000/faq");
    expect(urls).toContain("http://localhost:3000/shipping-and-returns");
    expect(urls).toContain("http://localhost:3000/payment-info");
    expect(urls).toContain("http://localhost:3000/categories/felt-sets");
    expect(urls).toContain(
      "http://localhost:3000/products/woodland-friends-felt-set",
    );
  });

  it("keeps private and thin pages out of the sitemap", () => {
    const privatePaths = [
      "/admin",
      "/api",
      "/cart",
      "/checkout",
      "/order",
      "/search",
    ];

    for (const path of privatePaths) {
      expect(urls.some((url) => url.includes(path))).toBe(false);
    }
  });

  it("uses the product updatedAt as lastModified", () => {
    const productEntry = entries.find((entry) =>
      entry.url.endsWith("/products/woodland-friends-felt-set"),
    );

    expect(productEntry?.lastModified).toEqual(
      new Date("2026-11-05T10:00:00.000Z"),
    );
  });
});

describe("robots", () => {
  const result = robots();

  it("disallows the private routes", () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallowed = rules.flatMap((rule) => rule.disallow ?? []);

    expect(disallowed).toEqual(
      expect.arrayContaining([
        "/admin",
        "/api",
        "/cart",
        "/checkout",
        "/order",
        "/search",
      ]),
    );
  });

  it("points crawlers at the sitemap", () => {
    expect(result.sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
