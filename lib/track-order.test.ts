import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ io: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/db", () => ({ prisma: { order: { findUnique: vi.fn() } } }));
import { prisma } from "@/lib/db";
import { findTrackedOrder } from "@/lib/track-order";
import { trackOrderSchema } from "@/lib/track-order-schema";

const input = { orderNumber: "AP-2026-0001", phone: "03001234567" };
const record = {
  orderNumber: input.orderNumber,
  customerPhone: "+923001234567",
  status: "PAID",
  total: 1800,
  courierName: null,
  trackingNumber: null,
  createdAt: new Date("2026-11-10T20:00:00Z"),
  paidAt: new Date("2026-11-11T00:00:00Z"),
  shippedAt: null,
  deliveredAt: null,
  cancelledAt: null,
  items: [
    {
      productTitle: "Felt set",
      variantLabel: "Blue",
      quantity: 2,
      id: "private-item",
    },
  ],
  events: [],
  id: "private-order",
  customerEmail: "private@example.test",
  addressLine1: "Private address",
  accessTokenHash: "must-not-return",
  paymentReference: "must-not-return",
  paymentNote: "must-not-return",
};

beforeEach(() => vi.clearAllMocks());

describe("tracking validation and lookup", () => {
  it.each([
    "03001234567",
    "+923001234567",
    "923001234567",
    "0300-1234567",
    "+92 (300) 1234567",
  ])("normalizes %s to digits only", (phone) => {
    expect(trackOrderSchema.parse({ ...input, phone }).phone).toBe(
      "923001234567",
    );
  });
  it.each([
    { ...input, phone: "" },
    { phone: input.phone },
    { ...input, phone: "3".repeat(33) },
    { ...input, orderNumber: "X".repeat(33) },
  ])("requires bounded valid fields", async (invalid) => {
    expect(await findTrackedOrder(invalid)).toBeNull();
    expect(prisma.order.findUnique).not.toHaveBeenCalled();
  });
  it("requires both order number and phone to match", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(record as never);
    expect(
      await findTrackedOrder({ ...input, phone: "03009999999" }),
    ).toBeNull();
    expect(await findTrackedOrder(input)).toMatchObject({
      orderNumber: input.orderNumber,
      total: 1800,
    });
    expect(prisma.order.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderNumber: input.orderNumber } }),
    );
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);
    expect(
      await findTrackedOrder({ ...input, orderNumber: "AP-2026-9999" }),
    ).toBeNull();
  });
  it("returns only public fields, including only available timestamps", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(record as never);
    const order = await findTrackedOrder(input);
    expect(Object.keys(order!).sort()).toEqual(
      [
        "orderNumber",
        "status",
        "total",
        "courierName",
        "trackingNumber",
        "timestamps",
        "items",
      ].sort(),
    );
    expect(order?.items).toEqual([
      { productTitle: "Felt set", variantLabel: "Blue", quantity: 2 },
    ]);
    expect(order?.timestamps.map((entry) => entry.status)).toEqual([
      "PENDING",
      "PAID",
    ]);
    expect(JSON.stringify(order)).not.toMatch(
      /private|must-not-return|923001234567/,
    );
    const query = vi.mocked(prisma.order.findUnique).mock.calls[0][0];
    expect(query?.select).not.toHaveProperty("accessTokenHash");
    expect(query?.select).not.toHaveProperty("id");
  });
  it("uses normalized legacy stored phones", async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      ...record,
      customerPhone: "0300-1234567",
    } as never);
    expect(await findTrackedOrder(input)).not.toBeNull();
  });
});
