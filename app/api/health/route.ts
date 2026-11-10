import { z } from "zod";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const querySchema = z.object({}).strict();
const responseHeaders = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request) {
  const limit = await consumeRateLimit("health", { requestHeaders: request.headers });
  if (!limit.allowed) return Response.json({ ok: false, message: "Please wait before checking again." }, {
    status: 429, headers: { ...responseHeaders, "Retry-After": String(limit.retryAfterSeconds) },
  });
  if (!querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams)).success) {
    return Response.json({ ok: false }, { status: 400, headers: responseHeaders });
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Health timeout")), 3000); }),
    ]);
    return Response.json({ ok: true }, { headers: responseHeaders });
  } catch {
    logger.warn("health_failed");
    return Response.json({ ok: false }, { status: 503, headers: responseHeaders });
  } finally { clearTimeout(timer); }
}
