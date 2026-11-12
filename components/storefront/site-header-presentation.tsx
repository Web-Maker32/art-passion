"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Search, Sun } from "lucide-react";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { Container } from "@/components/storefront/container";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/storefront/mobile-nav";
import {
  isNavigationLinkActive,
  navigationLinks,
} from "@/components/storefront/navigation-links";
import { MiniCart } from "@/components/storefront/mini-cart";
import type { CartView } from "@/lib/cart-types";
import { siteConfig } from "@/lib/site-config";

export function SiteHeaderPresentation({
  cart,
  deliveryFee,
  freeDeliveryThreshold,
}: {
  cart: CartView;
  deliveryFee: number;
  freeDeliveryThreshold: number;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <>
      <AnnouncementBar />
      <header
        className={`bg-brand-header border-gold/50 sticky top-0 z-50 border-b transition-shadow duration-interaction ${
          scrolled ? "shadow-lg shadow-black/25" : "shadow-soft"
        }`}
      >
        <Container className="flex min-h-16 items-center justify-between gap-2 py-2 sm:min-h-[76px] sm:gap-4">
          <Link
            aria-label={`${siteConfig.storeName} home`}
            className="focus-visible:outline-gold-light flex min-w-0 shrink-0 items-center gap-2.5 rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 sm:gap-3"
            href="/"
          >
            <Logo
              className="h-11 w-auto object-contain sm:h-14"
              priority
              size={56}
              variant="gold"
            />
            <span className="hidden min-w-0 min-[640px]:block">
              <span className="font-brand-display text-brand-gold block text-[1.7rem] leading-none font-semibold whitespace-nowrap">
                {siteConfig.storeName}
              </span>
              <span className="text-brand-foreground/85 mt-1 block text-xs tracking-[0.08em]">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-5 lg:flex xl:gap-7"
          >
            {navigationLinks.map(({ href, label }) => {
              const active = isNavigationLinkActive(href, pathname);
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`focus-visible:outline-gold-light after:bg-gold-light motion-safe:after:duration-interaction motion-safe:after:ease-interaction relative rounded-sm py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:after:scale-x-100 motion-safe:after:transition-transform motion-reduce:after:transition-none ${
                    active
                      ? "text-gold-light after:scale-x-100"
                      : "text-brand-foreground hover:text-gold-light"
                  }`}
                  href={href}
                  key={label}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              aria-label="Toggle dark mode"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light inline-flex size-11 items-center justify-center rounded-lg transition-colors duration-interaction hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Sun aria-hidden="true" className="hidden size-5 dark:block" />
              <Moon aria-hidden="true" className="size-5 dark:hidden" />
            </button>
            <Link
              aria-label="Search products"
              className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light inline-flex size-11 items-center justify-center rounded-lg transition-colors duration-interaction hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
              href="/search"
            >
              <Search aria-hidden="true" className="size-5" />
            </Link>
            <MiniCart
              cart={cart}
              deliveryFee={deliveryFee}
              freeDeliveryThreshold={freeDeliveryThreshold}
            />
            <div className="lg:hidden">
              <MobileNav />
            </div>
          </div>
        </Container>
      </header>
    </>
  );
}
