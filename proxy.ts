import { NextResponse, type NextRequest } from "next/server";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
  const path = request.nextUrl.pathname;
  const policy = /^\/search\/?$/.test(path) ? "search" : /^\/order\/[^/]+\/?$/.test(path) ? "order" : null;
  if (!policy) return NextResponse.next();
  const limit = await consumeRateLimit(policy, { requestHeaders: request.headers });
  if (limit.allowed) return NextResponse.next();
  return new NextResponse(request.method === "HEAD" ? null : "Too many requests. Please wait a moment and try again.", {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Retry-After": String(limit.retryAfterSeconds),
      "Cache-Control": "no-store",
      ...(policy === "order" ? { "Referrer-Policy": "no-referrer" } : {}),
    },
  });
}

// Never include the upload route: Proxy can buffer request bodies before handlers.
export const config = { matcher: ["/search", "/order/:orderNumber"] };
