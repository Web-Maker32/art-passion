// Payment webhooks stay disabled until a gateway is configured. Enabling one
// requires signature verification and PaymentEvent idempotency before any order
// status is changed.
function notImplemented() {
  return new Response("Payment webhooks are not enabled.", { status: 501 });
}

export const GET = notImplemented;
export const POST = notImplemented;
