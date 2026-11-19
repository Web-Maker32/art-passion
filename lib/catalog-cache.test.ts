import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { cacheMocks } = vi.hoisted(() => ({
  cacheMocks: {
    updateTag: vi.fn(),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
  },
}));

vi.mock("next/cache", () => cacheMocks);

import {
  CATALOG_CACHE_TAG,
  invalidateCatalogCache,
  revalidateCatalogCache,
} from "@/lib/catalog-cache";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("invalidateCatalogCache (Server Actions)", () => {
  it("expires the shared catalog tag and refreshes the sitemap", () => {
    invalidateCatalogCache();

    expect(cacheMocks.updateTag).toHaveBeenCalledTimes(1);
    expect(cacheMocks.updateTag).toHaveBeenCalledWith(CATALOG_CACHE_TAG);
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(cacheMocks.revalidateTag).not.toHaveBeenCalled();
  });
});

describe("revalidateCatalogCache (route handlers)", () => {
  it("revalidates the tag with expire 0 so stale data is never served", () => {
    revalidateCatalogCache();

    expect(cacheMocks.revalidateTag).toHaveBeenCalledTimes(1);
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith(CATALOG_CACHE_TAG, {
      expire: 0,
    });
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(cacheMocks.updateTag).not.toHaveBeenCalled();
  });
});