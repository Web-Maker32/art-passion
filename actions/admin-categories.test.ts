import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mocks } = vi.hoisted(() => ({
  mocks: {
    authorized: false,
    createCalled: 0,
    renameCalled: 0,
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/admin-auth", () => ({
  assertAdmin: vi.fn(async () =>
    mocks.authorized
      ? { authorized: true, userId: "admin-1" }
      : { authorized: false },
  ),
}));

vi.mock("@/lib/admin-categories", () => ({
  createCategory: vi.fn(async () => {
    mocks.createCalled += 1;
    return { status: "created", id: "c1", message: "Category created." };
  }),
  renameCategory: vi.fn(async () => {
    mocks.renameCalled += 1;
    return { status: "renamed", message: "Category renamed." };
  }),
}));

import {
  createAdminCategory,
  renameAdminCategory,
} from "@/actions/admin-categories";

const unauthorized = {
  success: false,
  message: "Your session expired. Please sign in again.",
};

beforeEach(() => {
  mocks.authorized = false;
  mocks.createCalled = 0;
  mocks.renameCalled = 0;
});

describe("admin category actions reject unauthenticated calls", () => {
  it("createAdminCategory is blocked", async () => {
    const result = await createAdminCategory({ name: "Wall art" });
    expect(result).toEqual(unauthorized);
    expect(mocks.createCalled).toBe(0);
  });

  it("renameAdminCategory is blocked", async () => {
    const result = await renameAdminCategory({ id: "c1", name: "Wall art" });
    expect(result).toEqual(unauthorized);
    expect(mocks.renameCalled).toBe(0);
  });
});

describe("admin category actions allow an authenticated admin", () => {
  it("reaches the create logic once authorized", async () => {
    mocks.authorized = true;
    const result = await createAdminCategory({ name: "Wall art" });
    expect(result.success).toBe(true);
    expect(mocks.createCalled).toBe(1);
  });
});
