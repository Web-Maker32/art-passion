"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
                    className={`focus-visible:outline-gold-light rounded-md px-3 py-3 focus-visible:outline-2 ${
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
      </SheetContent>
    </Sheet>
  );
}
