import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, sendMock } = vi.hoisted(() => ({
  state: { tasks: [] as Array<() => unknown>, failScheduling: false },
  sendMock: vi.fn(),
}));

vi.mock("next/server", () => ({
  after: (task: () => unknown) => {
    if (state.failScheduling) {
      throw new Error("after() was called outside a request scope");
    }
    state.tasks.push(task);
  },
}));

vi.mock("@/lib/email/send-owner-new-order", () => ({
  sendOwnerNewOrderEmail: sendMock,
}));

import { notifyOwnerOfNewOrder } from "@/lib/email/notify-owner";

describe("notifyOwnerOfNewOrder", () => {
  beforeEach(() => {
    state.tasks = [];
    state.failScheduling = false;
    sendMock.mockReset();
    sendMock.mockResolvedValue({ status: "sent" });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("schedules the email with after() instead of sending inline", () => {
    notifyOwnerOfNewOrder("AP-2026-0001");

    expect(state.tasks).toHaveLength(1);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends for the order number once the scheduled task runs", async () => {
    notifyOwnerOfNewOrder("AP-2026-0001");
    await state.tasks[0]();

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith("AP-2026-0001");
  });

  it("swallows a rejected send so the order is never affected", async () => {
    sendMock.mockRejectedValue(new Error("resend is down"));

    notifyOwnerOfNewOrder("AP-2026-0001");

    await expect(state.tasks[0]()).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });

  it("does not throw when after() is unavailable outside a request", async () => {
    state.failScheduling = true;

    expect(() => notifyOwnerOfNewOrder("AP-2026-0001")).not.toThrow();

    await vi.waitFor(() => expect(sendMock).toHaveBeenCalledWith("AP-2026-0001"));
  });
});
