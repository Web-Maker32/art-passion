import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "@/lib/whatsapp";

describe("buildWhatsAppLink", () => {
  it("normalizes the business number and URL-encodes the message", () => {
    const link = buildWhatsAppLink({
      number: "+92 (300) 123-4567",
      message: "Hello Art Passion! Felt set: Small set",
    });

    expect(link).not.toBeNull();
    const url = new URL(link!);
    expect(url.pathname).toBe("/923001234567");
    expect(url.searchParams.get("text")).toBe(
      "Hello Art Passion! Felt set: Small set",
    );
  });

  it("returns null when no phone number is configured", () => {
    expect(
      buildWhatsAppLink({ number: undefined, message: "Hello" }),
    ).toBeNull();
  });
});
