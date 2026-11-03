import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildCloudinarySignature } from "@/lib/storage";

const secret = "test-api-secret-not-a-real-secret";

function sha1(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

describe("buildCloudinarySignature", () => {
  it("sorts params, joins with &, appends the secret and SHA-1 hashes", () => {
    const signature = buildCloudinarySignature(
      {
        folder: "art-passion/products",
        allowed_formats: "jpg",
        timestamp: 1_000,
      },
      secret,
    );

    const expected = sha1(
      "allowed_formats=jpg&folder=art-passion/products&timestamp=1000" + secret,
    );
    expect(signature).toBe(expected);
  });

  it("excludes empty, null and undefined params", () => {
    const signature = buildCloudinarySignature(
      { a: "1", b: "", c: null, d: undefined, e: "2" },
      secret,
    );
    expect(signature).toBe(sha1("a=1&e=2" + secret));
  });

  it("normalizes booleans to 1 and 0", () => {
    const signature = buildCloudinarySignature(
      { flag: true, other: false },
      secret,
    );
    expect(signature).toBe(sha1("flag=1&other=0" + secret));
  });
});
