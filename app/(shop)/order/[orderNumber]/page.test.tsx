import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { findOrderMock, cookieValueMock, selectTokenMock } = vi.hoisted(() => ({
  findOrderMock: vi.fn(),
  cookieValueMock: vi.fn(async () => null as string | null),
  selectTokenMock: vi.fn(() => null as string | null),
}));

vi.mock("next/cache", () => ({ io: vi.fn(async () => {}) }));
vi.mock("@/lib/db", () => ({
  prisma: { order: { findUnique: findOrderMock } },
}));
vi.mock("@/lib/order-access", () => ({
  getOrderAccessCookieValue: cookieValueMock,
  selectOrderAccessToken: selectTokenMock,
}));
vi.mock("@/lib/payments/manual", () => ({
  manualEasypaisaProvider: { getInstructions: () => "Send the exact total." },
}));
vi.mock("@/components/storefront/payment-proof-form", () => ({
  PaymentProofForm: () => null,
}));

import OrderConfirmationPage from "@/app/(shop)/order/[orderNumber]/page";

const order = {
  id: "order-1",
  orderNumber: "AP-2026-0007",
  status: "PENDING",
  accessTokenHash: "a".repeat(64),
  subtotal: 3600,
  shipping: 350,
  total: 3950,
  customerName: "Ayesha Khan",
  customerPhone: "+923001234567",
  addressLine1: "House 12, Street 4",
  addressLine2: null,
  city: "Islamabad",
  province: "Islamabad Capital Territory",
  postalCode: "44000",
  country: "Pakistan",
  giftNote: null,
  orderNotes: null,
  courierName: null,
  trackingNumber: null,
  paymentReference: null,
  paymentNote: null,
  paymentReportedAt: null,
  items: [
    {
      id: "item-1",
      productTitle: "Felt Rose Kit",
      variantLabel: "Large",
      unitPrice: 1800,
      quantity: 2,
      leadTimeDays: null,
    },
  ],
};

async function renderPage(token?: string) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const element = await OrderConfirmationPage({
    params: Promise.resolve({ orderNumber: "AP-2026-0007" }),
    searchParams: Promise.resolve(token === undefined ? {} : { token }),
  });
  return renderToStaticMarkup(element);
}

describe("order confirmation page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieValueMock.mockResolvedValue(null);
    selectTokenMock.mockReturnValue(null);
    findOrderMock.mockResolvedValue(order);
  });

  it("shows a generic not-found without querying the order when no token is present", async () => {
    const html = await renderPage();

    expect(findOrderMock).not.toHaveBeenCalled();
    expect(html).toContain("Order not found");
    expect(html).not.toContain("Ayesha Khan");
    expect(html).not.toContain("+923001234567");
    expect(html).not.toContain("AP-2026-0007");
    expect(html).not.toContain("House 12");
    expect(html).not.toContain("Islamabad");
    expect(html).not.toContain("Felt Rose Kit");
    expect(html).not.toContain("3,950");
    expect(html).not.toContain("3950");
  });

  it("leaks no order details for a wrong token", async () => {
    const html = await renderPage("f".repeat(64));

    expect(findOrderMock).toHaveBeenCalled();
    expect(selectTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: "AP-2026-0007",
        urlToken: "f".repeat(64),
      }),
    );
    expect(html).toContain("Order not found");
    expect(html).not.toContain("Ayesha Khan");
    expect(html).not.toContain("+923001234567");
    expect(html).not.toContain("Felt Rose Kit");
    expect(html).not.toContain("House 12");
    expect(html).not.toContain("Islamabad");
    expect(html).not.toContain("3,950");
    expect(html).not.toContain("3950");
  });

  it("renders the confirmation for a valid URL token", async () => {
    selectTokenMock.mockReturnValue("b".repeat(64));

    const html = await renderPage("b".repeat(64));

    expect(html).toContain("Thank you, Ayesha Khan");
    expect(html).toContain("AP-2026-0007");
    expect(html).toContain("Felt Rose Kit");
  });

  it("still works on refresh with only the access cookie", async () => {
    cookieValueMock.mockResolvedValue("signed-cookie-value");
    selectTokenMock.mockReturnValue("b".repeat(64));

    const html = await renderPage();

    expect(cookieValueMock).toHaveBeenCalledWith("AP-2026-0007");
    expect(selectTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: "AP-2026-0007",
        urlToken: null,
        cookieValue: "signed-cookie-value",
      }),
    );
    expect(html).toContain("Thank you, Ayesha Khan");
  });
});