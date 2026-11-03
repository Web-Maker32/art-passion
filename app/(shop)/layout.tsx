import type { ReactNode } from "react";
import { StorefrontChrome } from "@/components/storefront/storefront-chrome";

// Storefront chrome lives here (not the root layout) so it never wraps /admin.
export default function ShopLayout({ children }: { children: ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
