import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function generateOrderAccessToken(): {
  rawToken: string;
  tokenHash: string;
} {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHmac("sha256", env.ORDER_ACCESS_SECRET)
    .update(rawToken)
    .digest("hex");

  return { rawToken, tokenHash };
}

export function verifyOrderAccessToken(
  rawToken: string,
  storedHash: string,
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(rawToken) || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const hashToTest = createHmac("sha256", env.ORDER_ACCESS_SECRET)
    .update(rawToken)
    .digest("hex");

  return timingSafeEqual(Buffer.from(hashToTest, "hex"), Buffer.from(storedHash, "hex"));
}