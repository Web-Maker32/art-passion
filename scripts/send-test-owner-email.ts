/**
 * Sends one clearly labelled TEST email to ORDER_NOTIFY_EMAIL so the Resend
 * setup can be checked without placing a real order.
 *
 *   pnpm email:test-owner
 */
import dotenv from "dotenv";
import { createResendClient } from "../lib/email/client";
import { buildOwnerNewOrderEmail, type OwnerEmailOrder } from "../lib/email/template";

dotenv.config({ path: [".env.local", ".env"] });

const apiKey = process.env.RESEND_API_KEY?.trim();
const to = process.env.ORDER_NOTIFY_EMAIL?.trim();
const from = process.env.EMAIL_FROM?.trim();

const sampleOrder: OwnerEmailOrder = {
  orderNumber: "TEST-0000",
  createdAt: new Date(),
  status: "PENDING",
  paymentMethod: "WALLET_TRANSFER",
  subtotal: 3900,
  shipping: 350,
  total: 4250,
  customerName: "Test Customer",
  customerPhone: "03001234567",
  customerEmail: "test@example.com",
  addressLine1: "House 1, Test Street",
  addressLine2: "Test Block",
  city: "Islamabad",
  province: "Islamabad Capital Territory",
  postalCode: "44000",
  country: "Pakistan",
  giftNote: "This is a test gift note.",
  orderNotes: "This is a test order note. No real order was placed.",
  items: [
    {
      productTitle: "Test Felt Play Set",
      variantLabel: "Small set",
      quantity: 1,
      unitPrice: 3200,
    },
    {
      productTitle: "Test Coloring Kit",
      variantLabel: "One kit",
      quantity: 1,
      unitPrice: 700,
    },
  ],
};

async function main(): Promise<void> {
  if (!apiKey || !to || !from) {
    console.error(
      "Refusing to send: RESEND_API_KEY, ORDER_NOTIFY_EMAIL and EMAIL_FROM must all be set (in .env.local).",
    );
    process.exit(1);
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
  const message = buildOwnerNewOrderEmail(sampleOrder, {
    adminOrderUrl: `${siteUrl}/admin/orders/${sampleOrder.orderNumber}`,
  });

  console.log(`Sending a TEST owner email from ${from} to ${to} ...`);

  const { error } = await createResendClient(apiKey).emails.send({
    from,
    to,
    subject: `[TEST] ${message.subject}`,
    html: message.html,
    text: message.text,
  });

  if (error) {
    console.error(`Resend rejected the TEST email: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  console.log("TEST email sent. Check the ORDER_NOTIFY_EMAIL inbox.");
}

main().catch((error: unknown) => {
  console.error(
    "The TEST email could not be sent:",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
});
