import { describe, expect, it } from "vitest";
import {
  OWNER_EMAIL_REMINDER,
  buildOwnerNewOrderEmail,
  escapeHtml,
  type OwnerEmailOrder,
} from "@/lib/email/template";

const order: OwnerEmailOrder = {
  orderNumber: "AP-2026-0001",
  createdAt: new Date("2026-11-06T14:42:00Z"),
  status: "PENDING",
  paymentMethod: "WALLET_TRANSFER",
  subtotal: 3900,
  shipping: 350,
  total: 4250,
  customerName: "Ayesha Khan",
  customerPhone: "03001234567",
  customerEmail: "ayesha@example.com",
  addressLine1: "House 12, Street 4",
  addressLine2: "F-8/3",
  city: "Islamabad",
  province: "Islamabad Capital Territory",
  postalCode: "44000",
  country: "Pakistan",
  giftNote: "Happy birthday!",
  orderNotes: "Please call before delivery.",
  items: [
    {
      productTitle: "Sample: Woodland Friends Felt Play Set",
      variantLabel: "Small set",
      quantity: 1,
      unitPrice: 3200,
    },
    {
      productTitle: "Sample: Rainbow Coloring Kit",
      variantLabel: "Complete kit",
      quantity: 2,
      unitPrice: 350,
    },
  ],
};

const adminOrderUrl = "https://example.test/admin/orders/AP-2026-0001";
const message = buildOwnerNewOrderEmail(order, { adminOrderUrl });

describe("buildOwnerNewOrderEmail", () => {
  it("uses the order number and total in the subject", () => {
    expect(message.subject).toBe("New order AP-2026-0001, Rs 4,250");
  });

  it("includes the order, items, totals and payment state in the HTML body", () => {
    for (const fragment of [
      "AP-2026-0001",
      "Rs 4,250",
      "PENDING, awaiting payment",
      "Easypaisa wallet transfer",
      "Sample: Woodland Friends Felt Play Set",
      "Small set",
      "Sample: Rainbow Coloring Kit",
      "Rs 3,200",
      "Rs 700",
      "Subtotal",
      "Rs 3,900",
      "Delivery",
      "Rs 350",
      "Ayesha Khan",
      "03001234567",
      "ayesha@example.com",
      "House 12, Street 4",
      "Islamabad",
      "Happy birthday!",
      "Please call before delivery.",
      adminOrderUrl,
      OWNER_EMAIL_REMINDER,
    ]) {
      expect(message.html).toContain(fragment);
    }
  });

  it("shows the placed date and time in Pakistan time", () => {
    expect(message.html).toContain("6 Nov 2026");
    expect(message.html).toContain("7:42 PM");
    expect(message.html).toContain("Pakistan time");
  });

  it("ships a plain-text version with the same facts", () => {
    for (const fragment of [
      "New order AP-2026-0001",
      "Rs 4,250",
      "PENDING, awaiting payment",
      "2 x Sample: Rainbow Coloring Kit (Complete kit)",
      "Rs 3,900",
      "Ayesha Khan",
      "03001234567",
      adminOrderUrl,
      OWNER_EMAIL_REMINDER,
    ]) {
      expect(message.text).toContain(fragment);
    }
    expect(message.text).not.toContain("<");
  });

  it("escapes customer-supplied text in the HTML body", () => {
    const hostile = buildOwnerNewOrderEmail(
      {
        ...order,
        customerName: '<script>alert("x")</script>',
        addressLine1: "House 5 & 6 <b>",
        orderNotes: '<img src=x onerror="alert(1)">',
      },
      { adminOrderUrl },
    );

    expect(hostile.html).not.toContain("<script>");
    expect(hostile.html).not.toContain("<img");
    expect(hostile.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(hostile.html).toContain("House 5 &amp; 6 &lt;b&gt;");
    expect(hostile.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("never contains an access token", () => {
    for (const body of [message.html, message.text, message.subject]) {
      expect(body).not.toMatch(/accessToken/i);
      expect(body).not.toMatch(/[0-9a-f]{32,}/i);
    }
  });

  it("escapeHtml leaves safe text alone and encodes the five HTML characters", () => {
    expect(escapeHtml("Ayesha Khan")).toBe("Ayesha Khan");
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
