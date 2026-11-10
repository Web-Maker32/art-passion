import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { manualEasypaisaProvider } from "@/lib/payments/manual";

describe("manualEasypaisaProvider.getInstructions", () => {
  it("builds the payment text from siteConfig with the exact template", () => {
    expect(manualEasypaisaProvider.method).toBe("WALLET_TRANSFER");
    expect(manualEasypaisaProvider.getInstructions()).toBe(
      "Easypaisa: 0300-0000000 | Account title: Test Account",
    );
  });

  it("uses only fictional test details", () => {
    const text = manualEasypaisaProvider.getInstructions();
    expect(text).not.toMatch(/WALLET_TRANSFER_DETAILS/);
    expect(text.split("\n")).toHaveLength(1);
    expect(text).toContain(" | Account title: ");
  });
});
