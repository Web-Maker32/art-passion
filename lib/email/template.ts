import { formatPrice } from "@/lib/format";

export type OwnerEmailOrderItem = {
  productTitle: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
};

/**
 * Everything the owner email needs. Deliberately excludes the order access token
 * and its hash: those must never leave the database.
 */
export type OwnerEmailOrder = {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string | null;
  country: string;
  giftNote: string | null;
  orderNotes: string | null;
  items: OwnerEmailOrderItem[];
};

export type OwnerEmailMessage = {
  subject: string;
  html: string;
  text: string;
};

export const OWNER_EMAIL_REMINDER =
  "Check Easypaisa for the payment, then mark the order paid in admin.";

/** Rupees use a plain space so the subject matches "New order AP-2026-0001, Rs 4,250". */
function rupees(value: number): string {
  return formatPrice(value).replace(/\u00a0/g, " ");
}

const placedDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Karachi",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const placedTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes customer-supplied text before it is placed in the HTML body. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);
}

function statusLabel(status: string): string {
  return status === "PENDING" ? "PENDING, awaiting payment" : status;
}

function paymentLabel(paymentMethod: string): string {
  return paymentMethod === "WALLET_TRANSFER" ? "Easypaisa wallet transfer" : paymentMethod;
}

function formatPlacedAt(value: Date): string {
  return `${placedDateFormatter.format(value)} at ${placedTimeFormatter.format(value)} (Pakistan time)`;
}

export function buildOwnerNewOrderEmail(
  order: OwnerEmailOrder,
  options: { adminOrderUrl: string },
): OwnerEmailMessage {
  const subject = `New order ${order.orderNumber}, ${rupees(order.total)}`;
  const placedAt = formatPlacedAt(order.createdAt);
  const status = statusLabel(order.status);
  const payment = paymentLabel(order.paymentMethod);
  const lines = order.items.map((item) => ({
    ...item,
    lineTotal: item.unitPrice * item.quantity,
  }));
  const addressLines = [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.province,
    order.postalCode,
    order.country,
  ].filter((line): line is string => Boolean(line && line.trim()));

  const detail = (label: string, value: string) => `
            <tr>
              <td style="padding: 4px 16px 4px 0; color: #4b5563; font-size: 14px; vertical-align: top;">${escapeHtml(label)}</td>
              <td style="padding: 4px 0; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(value)}</td>
            </tr>`;

  const itemRows = lines
    .map(
      (item) => `
            <tr>
              <td style="padding: 8px 16px 8px 0; color: #111827; font-size: 14px; border-top: 1px solid #e5e7eb;">
                ${escapeHtml(item.productTitle)}<br />
                <span style="color: #6b7280; font-size: 13px;">${escapeHtml(item.variantLabel)}</span>
              </td>
              <td style="padding: 8px 16px 8px 0; color: #111827; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb;">${item.quantity}</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right; border-top: 1px solid #e5e7eb;">${escapeHtml(rupees(item.lineTotal))}</td>
            </tr>`,
    )
    .join("");

  const notes = [
    order.orderNotes ? { heading: "Customer notes", body: order.orderNotes } : null,
    order.giftNote ? { heading: "Gift note", body: order.giftNote } : null,
  ].filter((note): note is { heading: string; body: string } => note !== null);

  const notesHtml = notes.length
    ? `
          <h2 style="margin: 24px 0 8px; color: #0a3533; font-size: 16px;">Notes</h2>
          ${notes
            .map(
              (note) => `
          <p style="margin: 0 0 6px; color: #4b5563; font-size: 14px; font-weight: 600;">${escapeHtml(note.heading)}</p>
          <p style="margin: 0 0 12px; color: #111827; font-size: 14px; white-space: pre-line;">${escapeHtml(note.body)}</p>`,
            )
            .join("")}`
    : "";

  const html = `<!doctype html>
<html lang="en">
  <body style="margin: 0; padding: 24px; background-color: #f4f1ea; font-family: Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
      <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">Art Passion</p>
      <h1 style="margin: 0; color: #0a3533; font-size: 22px;">New order ${escapeHtml(order.orderNumber)}</h1>
      <p style="margin: 8px 0 0; color: #111827; font-size: 16px; font-weight: 600;">${escapeHtml(rupees(order.total))} &middot; ${escapeHtml(status)}</p>
      <p style="margin: 4px 0 0; color: #4b5563; font-size: 14px;">Placed ${escapeHtml(placedAt)}</p>
      <p style="margin: 4px 0 0; color: #4b5563; font-size: 14px;">Payment: ${escapeHtml(payment)}</p>

      <h2 style="margin: 24px 0 8px; color: #0a3533; font-size: 16px;">Customer</h2>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${detail("Name", order.customerName)}
          ${detail("Phone", order.customerPhone)}
          ${detail("Email", order.customerEmail || "Not provided")}
          ${detail("Address", addressLines.join(", "))}
        </tbody>
      </table>

      <h2 style="margin: 24px 0 8px; color: #0a3533; font-size: 16px;">Items</h2>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 0 16px 6px 0; color: #6b7280; font-size: 12px; text-align: left;">Item</th>
            <th style="padding: 0 16px 6px 0; color: #6b7280; font-size: 12px; text-align: center;">Qty</th>
            <th style="padding: 0 0 6px; color: #6b7280; font-size: 12px; text-align: right;">Line total</th>
          </tr>
        </thead>
        <tbody>${itemRows}
        </tbody>
      </table>

      <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <tbody>
          ${detail("Subtotal", rupees(order.subtotal))}
          ${detail("Delivery", rupees(order.shipping))}
          ${detail("Total", rupees(order.total))}
        </tbody>
      </table>
${notesHtml}
      <p style="margin: 24px 0 0; padding: 12px 16px; background-color: #f9f7f2; border-left: 3px solid #e6c875; color: #0a3533; font-size: 14px;">${escapeHtml(OWNER_EMAIL_REMINDER)}</p>

      <p style="margin: 20px 0 0;">
        <a href="${escapeHtml(options.adminOrderUrl)}" style="display: inline-block; padding: 12px 20px; background-color: #0a3533; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Open the order in admin</a>
      </p>

      <p style="margin: 20px 0 0; color: #6b7280; font-size: 12px;">Automatic notification from the Art Passion shop. You are receiving this because a new order was placed.</p>
    </div>
  </body>
</html>`;

  const text = [
    `New order ${order.orderNumber}`,
    `Total: ${rupees(order.total)}`,
    `Status: ${status}`,
    `Payment: ${payment}`,
    `Placed: ${placedAt}`,
    "",
    "Customer",
    `  Name: ${order.customerName}`,
    `  Phone: ${order.customerPhone}`,
    `  Email: ${order.customerEmail || "Not provided"}`,
    `  Address: ${addressLines.join(", ")}`,
    "",
    "Items",
    ...lines.map(
      (item) =>
        `  ${item.quantity} x ${item.productTitle} (${item.variantLabel}) - ${rupees(item.unitPrice)} each, line total ${rupees(item.lineTotal)}`,
    ),
    "",
    `Subtotal: ${rupees(order.subtotal)}`,
    `Delivery: ${rupees(order.shipping)}`,
    `Total: ${rupees(order.total)}`,
    ...notes.flatMap((note) => ["", `${note.heading}: ${note.body}`]),
    "",
    `Open the order in admin: ${options.adminOrderUrl}`,
    "",
    OWNER_EMAIL_REMINDER,
  ].join("\n");

  return { subject, html, text };
}
