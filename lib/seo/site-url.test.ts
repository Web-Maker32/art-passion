import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  buildAbsoluteUrl,
  canonicalPath,
  getSiteUrl,
  stripTrailingSlashes,
} from "@/lib/seo/site-url";

describe("site url helpers", () => {
  it("strips trailing slashes from the configured site url", () => {
    expect(stripTrailingSlashes("https://artpassion.pk///")).toBe(
      "https://artpassion.pk",
    );
    expect(getSiteUrl()).not.toMatch(/\/$/);
  });

  it("drops query strings and hashes from canonical paths", () => {
    expect(canonicalPath("/products?sort=newest")).toBe("/products");
    expect(canonicalPath("/products#gallery")).toBe("/products");
    expect(canonicalPath("categories/felt-sets/")).toBe("/categories/felt-sets");
    expect(canonicalPath("/")).toBe("/");
  });

  it("joins the site url and the path without a double slash", () => {
    expect(buildAbsoluteUrl("https://artpassion.pk/", "/products/")).toBe(
      "https://artpassion.pk/products",
    );
    expect(buildAbsoluteUrl("https://artpassion.pk", "products")).toBe(
      "https://artpassion.pk/products",
    );
    expect(buildAbsoluteUrl("https://artpassion.pk/", "/")).toBe(
      "https://artpassion.pk",
    );
  });

  it("keeps the home page canonical free of a trailing slash", () => {
    expect(absoluteUrl("/")).toBe(getSiteUrl());
  });
});
