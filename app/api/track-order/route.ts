import { findTrackedOrder } from "@/lib/track-order";
import { consumeTrackOrderRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import {
  TRACK_ORDER_NOT_FOUND,
  TRACK_ORDER_RATE_LIMITED,
  trackOrderSchema,
  type TrackOrderResponse,
} from "@/lib/track-order-schema";

const privacyHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};

function reply(body: TrackOrderResponse, status: number, retryAfter?: number) {
  return Response.json(body, {
    status,
    headers: {
      ...privacyHeaders,
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

/** Bound the body even when Content-Length is absent or dishonest. */
async function readInput(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  let size = 0;
  let text = "";
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const input = await readInput(request);
  const parsed = trackOrderSchema.safeParse(input);
  const rawNumber =
    input && typeof input === "object" && "orderNumber" in input
      ? input.orderNumber
      : undefined;
  const orderKey =
    typeof rawNumber === "string" && rawNumber.length <= 32
      ? rawNumber.trim().toUpperCase()
      : undefined;
  const limit = await consumeTrackOrderRateLimit(request.headers, orderKey);
  if (!limit.allowed)
    return reply(
      { ok: false, message: TRACK_ORDER_RATE_LIMITED },
      429,
      limit.retryAfterSeconds,
    );
  const origin = request.headers.get("origin");
  if (
    !parsed.success ||
    new URL(request.url).search ||
    (origin && origin !== new URL(request.url).origin)
  ) {
    return reply({ ok: false, message: TRACK_ORDER_NOT_FOUND }, 400);
  }
  try {
    const order = await findTrackedOrder(input);
    return order
      ? reply({ ok: true, order }, 200)
      : reply({ ok: false, message: TRACK_ORDER_NOT_FOUND }, 404);
  } catch {
    logger.warn("track_order_failed");
    return reply(
      {
        ok: false,
        message:
          "Order tracking is temporarily unavailable. Please try again shortly or message us on WhatsApp.",
      },
      503,
    );
  }
}
