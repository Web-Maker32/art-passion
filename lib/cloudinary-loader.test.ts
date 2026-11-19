import { describe, expect, it } from "vitest";
import cloudinaryLoader from "@/lib/cloudinary-loader";

const CLOUDINARY_SRC =
  "https://res.cloudinary.com/demo/image/upload/v1700000000/felt-set.jpg";

describe("cloudinaryLoader", () => {
  it("passes local assets through untouched", () => {
    expect(cloudinaryLoader({ src: "/placeholder.svg", width: 512 })).toBe(
      "/placeholder.svg",
    );
    expect(cloudinaryLoader({ src: "/logo-gold.png", width: 256 })).toBe(
      "/logo-gold.png",
    );
  });

  it("passes non-Cloudinary hosts through untouched", () => {
    const src = "https://example.com/photo.jpg";
    expect(cloudinaryLoader({ src, width: 640 })).toBe(src);
  });

  it("returns an empty src unchanged", () => {
    expect(cloudinaryLoader({ src: "", width: 640 })).toBe("");
  });

  it("inserts f_auto,q_auto and the nearest width step after /upload/", () => {
    expect(cloudinaryLoader({ src: CLOUDINARY_SRC, width: 500 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_512/v1700000000/felt-set.jpg",
    );
  });

  it("rounds up to the next width step and caps at the largest one", () => {
    expect(cloudinaryLoader({ src: CLOUDINARY_SRC, width: 256 })).toContain(
      "w_256",
    );
    expect(cloudinaryLoader({ src: CLOUDINARY_SRC, width: 4096 })).toContain(
      "w_2048",
    );
  });

  it("never stacks transforms when one is already present", () => {
    const transformed =
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_512/v1/felt-set.jpg";
    expect(cloudinaryLoader({ src: transformed, width: 1080 })).toBe(
      transformed,
    );
    const widthOnly =
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_512/v1/felt-set.jpg";
    expect(cloudinaryLoader({ src: widthOnly, width: 1080 })).toBe(widthOnly);
  });
});