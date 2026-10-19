"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Container } from "@/components/storefront/container";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/storefront/mobile-nav";
import {
  isNavigationLinkActive,
  navigationLinks,
} from "@/components/storefront/navigation-links";
import { MiniCart } from "@/components/storefront/mini-cart";
import type { CartView } from "@/lib/cart-types";

export function SiteHeaderPresentation({ cart }: { cart: CartView }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header
      className={`bg-brand-header border-gold/60 sticky top-0 z-50 border-b transition-shadow ${
        scrolled ? "shadow-lg shadow-black/20" : "shadow-sm shadow-black/10"
      }`}
    >
      <Container className="flex min-h-[72px] items-center justify-between gap-3 py-2 sm:min-h-[88px] sm:gap-5">
        <Link
          aria-label="Art Passion home"
          className="focus-visible:outline-gold-light flex min-w-0 shrink-0 items-center gap-2 rounded-sm p-2 focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-3"
          href="/"
        >
          <Logo
            className="h-14 w-auto object-contain min-[640px]:h-[72px]"
            priority
            size={56}
            variant="gold"
          />
          <span className="hidden min-w-0 min-[640px]:block">
            <span className="font-brand-display text-brand-gold block text-3xl leading-none font-semibold whitespace-nowrap">
              Art Passion
            </span>
            <span className="text-brand-foreground mt-1 block text-xs tracking-wide">
              the passion of art
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-5 lg:flex xl:gap-6"
        >
          {navigationLinks.map(({ href, label }) => {
            const active = isNavigationLinkActive(href, pathname);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`focus-visible:outline-gold-light relative rounded-sm py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${
                  active
                    ? "text-gold-light after:bg-gold-light after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px"
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

        <div className="flex shrink-0 items-center gap-1">
          <Link
            aria-label="Search products"
            className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light rounded-md p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            href="/search"
          >
            <Search aria-hidden="true" className="size-5" />
          </Link>
          <MiniCart cart={cart} />
          <div className="lg:hidden">
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
