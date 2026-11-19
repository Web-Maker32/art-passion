import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("server-only", () => ({}));

const { cookieStore, mockUser } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
  mockUser: {
    id: "admin-1",
    email: "admin@test.com",
    role: "ADMIN" as string,
    passwordHash: "",
    sessionVersion: 0,
    deleted: false,
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      const value = cookieStore.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set: (name: string, value: string) => cookieStore.set(name, value),
    delete: (name: string) => cookieStore.delete(name),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(
        async ({
          where,
        }: {
          where: { email?: string; id?: string };
        }) => {
          if (mockUser.deleted) return null;
          if (where.email && where.email === mockUser.email) {
            return {
              id: mockUser.id,
              passwordHash: mockUser.passwordHash,
              role: mockUser.role,
              sessionVersion: mockUser.sessionVersion,
            };
          }
          if (where.id && where.id === mockUser.id) {
            return { id: mockUser.id, role: mockUser.role, sessionVersion: mockUser.sessionVersion };
          }
          return null;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { sessionVersion?: { increment: number } };
        }) => {
          if (where.id === mockUser.id && data.sessionVersion?.increment) {
            mockUser.sessionVersion += data.sessionVersion.increment;
          }
          return { id: mockUser.id };
        },
      ),
    },
  },
}));

import {
  verifyAdminCredentials,
  resolveAdminUserId,
  requireAdmin,
  assertAdmin,
  bumpAdminSessionVersion,
} from "@/lib/admin-auth";
import {
  createAdminSessionCookieValue,
  adminSessionCookieName,
  adminSessionTtlMs,
} from "@/lib/admin-session";

const testPassword = "correct-horse-battery";

beforeEach(() => {
  cookieStore.clear();
  mockUser.passwordHash = bcrypt.hashSync(testPassword, 4);
  mockUser.role = "ADMIN";
  mockUser.sessionVersion = 0;
  mockUser.deleted = false;
});

describe("verifyAdminCredentials", () => {
  it("returns userId for correct credentials", async () => {
    const result = await verifyAdminCredentials({
      email: "admin@test.com",
      password: testPassword,
    });
    expect(result).toEqual({ userId: "admin-1", sessionVersion: 0 });
  });

  it("returns null for wrong password", async () => {
    const result = await verifyAdminCredentials({
      email: "admin@test.com",
      password: "wrong-password",
    });
    expect(result).toBeNull();
  });

  it("returns null for unknown email", async () => {
    const result = await verifyAdminCredentials({
      email: "nobody@test.com",
      password: testPassword,
    });
    expect(result).toBeNull();
  });

  it("returns null when role is not ADMIN", async () => {
    mockUser.role = "CUSTOMER";
    const result = await verifyAdminCredentials({
      email: "admin@test.com",
      password: testPassword,
    });
    expect(result).toBeNull();
  });
});

describe("resolveAdminUserId", () => {
  it("returns userId with a valid session cookie", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0)
    );
    expect(await resolveAdminUserId()).toBe("admin-1");
  });

  it("returns null with no cookie", async () => {
    expect(await resolveAdminUserId()).toBeNull();
  });

  it("returns null with a tampered cookie", async () => {
    const value = createAdminSessionCookieValue("admin-1", 0);
    const tampered = `${value.slice(0, -1)}${value.endsWith("0") ? "1" : "0"}`;
    cookieStore.set(adminSessionCookieName, tampered);
    expect(await resolveAdminUserId()).toBeNull();
  });

  it("returns null when user is deleted", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0)
    );
    mockUser.deleted = true;
    expect(await resolveAdminUserId()).toBeNull();
  });

  it("returns null when user is demoted to CUSTOMER", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0)
    );
    mockUser.role = "CUSTOMER";
    expect(await resolveAdminUserId()).toBeNull();
  });

  it("returns null with an expired session", async () => {
    const past = Date.now() - adminSessionTtlMs - 1000;
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0, past),
    );
    expect(await resolveAdminUserId()).toBeNull();
  });

  it("returns null when the cookie version is behind the user version", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0),
    );
    mockUser.sessionVersion = 1;
    expect(await resolveAdminUserId()).toBeNull();
  });

  it("resolves again once the cookie carries the current version", async () => {
    mockUser.sessionVersion = 2;
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 2),
    );
    expect(await resolveAdminUserId()).toBe("admin-1");
  });
});

describe("bumpAdminSessionVersion", () => {
  it("invalidates previously issued cookies", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0),
    );
    expect(await resolveAdminUserId()).toBe("admin-1");

    await bumpAdminSessionVersion("admin-1");

    expect(mockUser.sessionVersion).toBe(1);
    expect(await resolveAdminUserId()).toBeNull();
  });
});

describe("requireAdmin", () => {
  it("redirects to login when no session", async () => {
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("redirects to login with a tampered cookie", async () => {
    cookieStore.set(adminSessionCookieName, "tampered.garbage");
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("returns userId when session is valid", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0)
    );
    await expect(requireAdmin()).resolves.toBe("admin-1");
  });
});

describe("assertAdmin", () => {
  it("returns authorized false without session", async () => {
    expect(await assertAdmin()).toEqual({ authorized: false });
  });

  it("returns authorized true with valid session", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0)
    );
    expect(await assertAdmin()).toEqual({
      authorized: true,
      userId: "admin-1",
    });
  });

  it("returns authorized false when user is deleted", async () => {
    cookieStore.set(
      adminSessionCookieName,
      createAdminSessionCookieValue("admin-1", 0)
    );
    mockUser.deleted = true;
    expect(await assertAdmin()).toEqual({ authorized: false });
  });
});
