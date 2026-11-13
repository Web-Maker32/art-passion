"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  ExternalLink,
  LogOut,
  Menu,
  Sun,
  Moon,
} from "lucide-react";
import { adminLogout } from "@/actions/admin-login";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
];

function AdminNavigation({
  pendingCount,
  mobile = false,
}: {
  pendingCount: number;
  mobile?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className="flex h-full min-h-0 flex-col gap-6 p-4">
      <Link
        href="/admin"
        className="flex min-h-12 items-center gap-3 rounded-lg"
      >
        <Logo size={44} priority={false} variant="badge" />
        <span>
          <span className="font-heading block text-lg font-semibold">
            Art Passion
          </span>
          <span className="text-muted-foreground text-xs">Owner workspace</span>
        </span>
      </Link>
      <nav
        aria-label={mobile ? "Mobile admin navigation" : "Admin navigation"}
        className="space-y-1"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin" ? pathname === href : pathname.startsWith(href);
          const linkProps = {
            href,
            "aria-current": active ? ("page" as const) : undefined,
            className: `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors motion-reduce:transition-none ${active ? "bg-accent text-accent-foreground" : "text-foreground hover-fine:hover:bg-muted"}`,
          };
          const content = (
            <>
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="flex-1">{label}</span>
              {href === "/admin/orders" && (
                <Badge
                  variant="gold"
                  aria-label={`${pendingCount} pending orders`}
                >
                  {pendingCount}
                </Badge>
              )}
            </>
          );
          return mobile ? (
            <SheetClose
              key={href}
              nativeButton={false}
              render={<Link {...linkProps} />}
            >
              {content}
            </SheetClose>
          ) : (
            <Link key={href} {...linkProps}>
              {content}
            </Link>
          );
        })}
      </nav>
      <div className="border-border mt-auto space-y-2 border-t pt-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover-fine:hover:bg-muted flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          View store
        </Link>
        <form action={adminLogout}>
          <Button
            type="submit"
            variant="outline"
            className="min-h-11 w-full justify-start"
          >
            <LogOut aria-hidden="true" className="size-4" />
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminHeader({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const section = links.find(
    (link) => link.href !== "/admin" && pathname.startsWith(link.href),
  );
  const title = pathname.endsWith("/new")
    ? "New product"
    : section && pathname !== section.href
      ? `${section.label === "Orders" ? "Order" : "Product"} details`
      : (section?.label ?? "Dashboard");
  return (
    <>
      <aside className="border-border bg-card fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r lg:block">
        <AdminNavigation pendingCount={pendingCount} />
      </aside>
      <header className="border-border bg-card sticky top-0 z-20 flex min-h-20 items-center justify-between gap-3 border-b px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open admin navigation"
                  />
                }
              >
                <Menu aria-hidden="true" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(86vw,20rem)]">
                <SheetHeader>
                  <SheetTitle>Admin navigation</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <AdminNavigation pendingCount={pendingCount} mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <nav
              aria-label="Breadcrumb"
              className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs"
            >
              <Link
                href="/admin"
                className="inline-flex min-h-11 items-center rounded-sm"
              >
                Admin
              </Link>
              {section && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link
                    href={section.href}
                    className="inline-flex min-h-11 items-center rounded-sm"
                  >
                    {section.label}
                  </Link>
                </>
              )}
              {section && pathname !== section.href && (
                <>
                  <span aria-hidden="true">/</span>
                  <span aria-current="page">{title}</span>
                </>
              )}
            </nav>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Toggle color theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun aria-hidden="true" className="hidden dark:block" />
          <Moon aria-hidden="true" className="dark:hidden" />
        </Button>
      </header>
    </>
  );
}
