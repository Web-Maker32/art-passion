"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isNavigationLinkActive,
  navigationLinks,
} from "@/components/storefront/navigation-links";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            aria-label="Open navigation menu"
            className="text-brand-foreground hover:text-gold-light focus-visible:ring-gold-light hover:bg-white/10"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent
        aria-label="Main navigation"
        className="border-gold/50 bg-header-teal text-brand-foreground w-[86vw] max-w-sm"
      >
        <SheetHeader className="pb-2">
          <SheetTitle className="font-brand-display text-gold-light text-2xl font-semibold">
            Explore Art Passion
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-3">
          <SheetClose
            nativeButton={false}
            render={
              <Link
                className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light flex min-h-12 items-center gap-3 rounded-xl px-4 text-base font-medium transition-colors duration-interaction hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                href="/search"
              />
            }
          >
            <Search aria-hidden="true" className="size-5" />
            Search products
          </SheetClose>
          {navigationLinks.map(({ href, label }) => {
            const active = isNavigationLinkActive(href, pathname);
            return (
              <SheetClose
                key={label}
                nativeButton={false}
                render={
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`focus-visible:outline-gold-light flex min-h-12 items-center rounded-xl px-4 text-base font-medium transition-colors duration-interaction focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      active
                        ? "text-gold-light bg-white/10"
                        : "text-brand-foreground hover:text-gold-light hover:bg-white/10"
                    }`}
                    href={href}
                  />
                }
              >
                {label}
              </SheetClose>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between border-t border-white/10 px-4 py-4">
          <span className="text-brand-foreground/85 text-sm font-medium">Theme</span>
          <button
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light inline-flex size-11 items-center justify-center rounded-lg transition-colors duration-interaction hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            type="button"
          >
            {isDark ? (
              <Sun aria-hidden="true" className="size-5" />
            ) : (
              <Moon aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
