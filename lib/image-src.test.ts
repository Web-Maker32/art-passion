import { describe, expect, it } from "vitest";
import { isUnoptimizedImageSrc } from "@/lib/image-src";

describe("isUnoptimizedImageSrc", () => {
  it("flags local assets served from /public", () => {
    expect(isUnoptimizedImageSrc("/placeholder.svg")).toBe(true);
    expect(isUnoptimizedImageSrc("/logo-gold.png")).toBe(true);
    expect(isUnoptimizedImageSrc("/og-image.png")).toBe(true);
  });

  it("flags SVGs on any host, ignoring query strings and case", () => {
    expect(isUnoptimizedImageSrc("https://res.cloudinary.com/demo/image/upload/icon.svg")).toBe(true);
    expect(isUnoptimizedImageSrc("https://example.com/a/b.SVG?v=2")).toBe(true);
  });

  it("treats an empty src as unoptimized", () => {
    expect(isUnoptimizedImageSrc("")).toBe(true);
  });

  it("keeps Cloudinary raster images on the optimization loader", () => {
    expect(
      isUnoptimizedImageSrc("https://res.cloudinary.com/demo/image/upload/v1/felt.jpg"),
    ).toBe(false);
    expect(
      isUnoptimizedImageSrc("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_512/felt.png"),
    ).toBe(false);
  });
});