"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun } from "lucide-react";
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
        className="border-gold/60 bg-header-teal text-brand-foreground"
      >
        <SheetHeader>
          <SheetTitle className="font-brand-display text-gold-light text-xl">
            Explore Art Passion
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile navigation" className="flex flex-col px-4">
          {navigationLinks.map(({ href, label }) => {
            const active = isNavigationLinkActive(href, pathname);
            return (
              <SheetClose
                key={label}
                render={
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`focus-visible:outline-gold-light relative rounded-md px-3 py-3 focus-visible:outline-2 after:absolute after:inset-x-3 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-gold-light motion-safe:after:transition-transform motion-safe:after:duration-interaction motion-safe:after:ease-interaction motion-reduce:after:transition-none hover:after:scale-x-100 focus-visible:after:scale-x-100 ${
                      active
                        ? "text-gold-light bg-white/10 after:scale-x-100"
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
        <div className="mt-6 flex items-center justify-between border-t border-white/10 px-4 pt-4">
          <span className="text-brand-foreground/80 text-sm">Theme</span>
          <button
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="text-brand-foreground hover:text-gold-light focus-visible:outline-gold-light rounded-md p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2"
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
