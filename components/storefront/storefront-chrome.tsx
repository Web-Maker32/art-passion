import type { ReactNode } from "react";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";

/**
 * Storefront-only chrome: skip link, site header (which includes the mini-cart),
 * main landmark, footer and the floating WhatsApp button.
 *
 * Rendered by the storefront route-group layouts and the home page only. The
 * admin area is a sibling of those groups under the root layout, so it never
 * inherits this chrome. The root layout keeps the shared shell (html/body,
 * fonts, theme provider and the Toaster) so both areas stay themed.
 */
export function StorefrontChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        className="bg-card text-foreground sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        href="#main-content"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main className="flex-1 pb-[88px]" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
