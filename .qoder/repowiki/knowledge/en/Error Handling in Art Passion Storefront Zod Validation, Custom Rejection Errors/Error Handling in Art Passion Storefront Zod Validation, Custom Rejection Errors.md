---
kind: error_handling
name: 'Error Handling in Art Passion Storefront: Zod Validation, Custom Rejection Errors, and Result-Returning Business Layer'
category: error_handling
scope:
    - '**'
source_files:
    - lib/env.ts
    - lib/db.ts
    - lib/orders.ts
    - actions/checkout.ts
    - app/api/webhooks/payments/route.ts
    - lib/cart.ts
    - lib/order-access.ts
---

# Error Handling in Art Passion Storefront

## Approach Overview

The repository uses a layered error-handling strategy built around three core mechanisms:

1. **Zod-based input validation** — environment variables and form data are validated at boundaries via `zod` schemas; invalid inputs produce structured errors or typed result objects rather than throwing.
2. **Domain-specific rejection types** — business logic returns explicit result unions (`OrderCreationResult`, `CheckoutActionResult`) instead of throwing for expected failure modes (empty cart, stock mismatch, duplicate submission).
3. **Selective `try/catch` with rethrowing** — only the outermost layer catches unexpected exceptions; domain-level errors are represented by a custom `CheckoutRejected` class that is caught and translated into a result union.

There is no centralized error middleware, no global `unhandledRejection` handler, and no custom error-code enumeration. Errors propagate as native JavaScript `Error`/`RangeError` instances unless wrapped in a result type.

## Key Files and Patterns

### Environment Validation (`lib/env.ts`)

All required runtime configuration is validated once at import time using a single `z.object` schema. Missing or malformed values cause `zod` to throw during module initialization, which prevents the app from starting with an incomplete environment. The schema also enforces minimum lengths on secrets (`CART_COOKIE_SECRET`, `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET` all require ≥ 32 characters) and URL validity on `NEXT_PUBLIC_SITE_URL`.

### Database Connection (`lib/db.ts`)

Throws a plain `Error("DATABASE_URL is required to connect to Neon.")` if the database URL is absent — this is the startup guard that surfaces missing Prisma connection configuration.

### Domain Rejection Type (`lib/orders.ts`)

Defines a private `CheckoutRejected extends Error` class whose constructor takes a discriminated `reason` field of type `"empty" | "review" | "stock"`. This is the primary sentinel-error pattern in the codebase: business rules that can fail without being fatal throw `CheckoutRejected(reason)` inside the transaction, and the surrounding `try/catch` converts it back into `{ status: "rejected", reason }`.

The function `createOrderFromCart` returns the union type `OrderCreationResult`:

```ts
type OrderCreationResult =
  | { status: "created"; orderNumber: string; accessToken: string }
  | { status: "duplicate"; orderNumber: string }
  | { status: "rejected"; reason: "empty" | "review" | "stock" };
```

This is the canonical way the business layer communicates outcomes to callers — no thrown errors for normal business failures.

### Action Boundary (`actions/checkout.ts`)

The server action `processCheckout` defines its own return type `CheckoutActionResult`:

```ts
type CheckoutActionResult =
  | { success: true; orderNumber: string; accessToken: string }
  | { success: false; message: string; fieldErrors?: Record<string, string>; orderNumber?: string };
```

It translates every possible outcome into this shape:
- Duplicate idempotency key → `{ success: false, message, orderNumber }`
- Rate limit hit → `{ success: false, message: "Please wait a moment before trying again." }`
- Zod validation failure → maps each issue's path/message into a `fieldErrors` record
- `OrderCreationResult.rejected` → maps `empty`/`review`/`stock` reasons to user-facing messages
- Unexpected exception → logs via `console.error` and returns a generic `{ success: false, message: "We could not place your order. Please try again." }`

### Payment Webhook Stub (`app/api/webhooks/payments/route.ts`)

Both GET and POST handlers return a static `Response("Payment webhooks are not enabled.", { status: 501 })` via a shared `notImplemented()` helper. A file-level comment documents the future requirement: signature verification and `PaymentEvent` idempotency before any order status change.

### Other Throw Sites

- `lib/cart.ts` throws when `CART_COOKIE_SECRET` is shorter than 32 characters (enforced by the env schema earlier, but duplicated here as a runtime assertion).
- `lib/order-access.ts` throws `new Error("Cannot store an invalid order access token.")` for malformed tokens.
- `lib/orders.ts::calculateOrderTotals` throws `new RangeError("An order must contain at least one item.")` for empty line arrays.
- `lib/orders.ts::nextOrderNumber` throws `new Error("The order counter did not return a valid value.")` when the atomic counter query yields a non-integer.

### Transaction-Level Error Handling

Inside `prisma.$transaction`, `CheckoutRejected` is caught and mapped to `{ status: "rejected", reason }`. A `Prisma.PrismaClientKnownRequestError` with code `P2002` (unique constraint violation) is specifically handled: the code queries for the existing order by idempotency key and returns `{ status: "duplicate", orderNumber }` rather than surfacing the raw Prisma error. Any other error is rethrown (`throw error`).

## Architecture and Conventions

- **Validation-first**: All external inputs (env vars, form payloads, idempotency keys) are validated through `zod` before reaching business logic. Invalid inputs are converted into typed result objects with user-facing messages, not thrown.
- **Business-layer result unions**: Functions that can fail due to domain rules return discriminated unions (`OrderCreationResult`, `CheckoutActionResult`) so callers handle each branch explicitly.
- **Custom sentinel errors for exceptional-but-expected cases**: `CheckoutRejected` is used exclusively inside the checkout transaction to signal business-rule violations; it is never exposed to callers.
- **Catch-and-rethrow at the boundary**: Only the outermost `try/catch` (in `createOrderFromCart` and `processCheckout`) handles exceptions. Unexpected errors bubble up to Next.js's default error handler after being logged.
- **No global error middleware**: There is no `error.ts` layout, no `uncaughtException` listener, and no Express-style error middleware. Error presentation is localized to each action/page.
- **Idempotency over retries**: Duplicate submissions are detected both at the action level (pre-check against `idempotencyKey`) and inside the transaction (Prisma unique constraint + advisory lock), returning a stable `{ status: "duplicate" }` result.

## Conventions and Constraints

- Environment variables are declared and validated in a single schema in `lib/env.ts`; adding a new secret requires updating both the schema and the `.env.example` file.
- Secret fields (`CART_COOKIE_SECRET`, `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET`) are constrained to a minimum of 32 characters by the zod schema.
- Business failures use result-returning functions rather than throwing; only truly exceptional conditions (missing config, malformed internal state, DB integrity failures) throw.
- User-facing error messages are defined inline in `actions/checkout.ts` and map internal reasons (`empty`, `review`, `stock`) to friendly text.
- Field-level validation errors from Zod are flattened into a `Record<string, string>` keyed by the first segment of each issue's path.
- The payment webhook route intentionally returns HTTP 501 until a gateway is configured; enabling it requires implementing signature verification and event idempotency as documented in the file comment.