import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { requireAdminMock, getAdminOrderMock, notFoundMock } = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getAdminOrderMock: vi.fn(),
  notFoundMock: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({ requireAdmin: requireAdminMock }));

vi.mock("@/lib/queries/admin-orders", () => ({
  getAdminOrder: getAdminOrderMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock.mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import AdminOrderPrintPage from "@/app/admin/(print)/orders/[orderNumber]/print/page";

const order = {
  id: "order-1",
  orderNumber: "AP-2026-0007",
  createdAt: new Date("2026-11-10T09:30:00.000Z"),
  status: "PROCESSING",
  paymentMethod: "WALLET_TRANSFER",
  paymentReference: "TXN123456",
  paymentNote: null,
  paymentReportedAt: null,
  paidAt: new Date("2026-11-10T10:00:00.000Z"),
  shippedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  subtotal: 3600,
  shipping: 350,
  total: 3950,
  customerName: "Ayesha Khan",
  customerEmail: "ayesha@example.com",
  customerPhone: "03001234567",
  addressLine1: "House 12, Street 4",
  addressLine2: null,
  city: "Islamabad",
  province: "Islamabad Capital Territory",
  postalCode: "44000",
  country: "Pakistan",
  giftNote: "Happy birthday!",
  orderNotes: "Call before delivery.",
  courierName: null,
  trackingNumber: null,
  stockRestoredAt: null,
  items: [
    {
      id: "item-1",
      productTitle: "Felt Rose Kit",
      variantLabel: "Large",
      unitPrice: 1800,
      quantity: 2,
      leadTimeDays: null,
      madeToOrder: false,
    },
  ],
  events: [],
};

async function renderPage(orderNumber: string) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const element = await AdminOrderPrintPage({
    params: Promise.resolve({ orderNumber }),
  });
  return renderToStaticMarkup(element);
}

describe("packing slip page", () => {
  it("requires an admin session", async () => {
    requireAdminMock.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));

    await expect(renderPage("AP-2026-0007")).rejects.toThrow("NEXT_REDIRECT");
    expect(getAdminOrderMock).not.toHaveBeenCalled();
  });

  it("returns not found for a missing order", async () => {
    requireAdminMock.mockResolvedValueOnce("admin-1");
    getAdminOrderMock.mockResolvedValueOnce(null);

    await expect(renderPage("AP-2026-9999")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the slip without storefront chrome", async () => {
    requireAdminMock.mockResolvedValueOnce("admin-1");
    getAdminOrderMock.mockResolvedValueOnce(order);

    const html = await renderPage("AP-2026-0007");

    expect(getAdminOrderMock).toHaveBeenCalledWith("AP-2026-0007");
    expect(html).toContain("AP-2026-0007");
    expect(html).toContain("Packing slip");
    expect(html).toContain("Ayesha Khan");
    expect(html).toContain("03001234567");
    expect(html).toContain("House 12, Street 4");
    expect(html).toContain("Felt Rose Kit");
    expect(html).toContain("Large");
    expect(html).toContain("Happy birthday!");
    expect(html).toContain("Call before delivery.");
    expect(html).toContain("Rs");
    expect(html).toContain("3,950");
    expect(html).not.toContain("Message customer on WhatsApp");
  });
});
