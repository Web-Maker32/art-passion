import Link from "next/link";
import { adminLogout } from "@/actions/admin-login";
import { Container } from "@/components/storefront/container";
import { Button } from "@/components/ui/button";

const navLinkClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover-fine:hover:text-foreground focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2";

export function AdminHeader() {
  return (
    <header className="border-silver bg-card border-b">
      <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-heading text-lg font-semibold">
            Art Passion <span className="text-brand">Admin</span>
          </span>
          <nav aria-label="Admin" className="flex items-center gap-1">
            <Link className={navLinkClass} href="/admin">
              Dashboard
            </Link>
            <Link className={navLinkClass} href="/admin/orders">
              Orders
            </Link>
          </nav>
        </div>
        <form action={adminLogout}>
          <Button size="sm" type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </Container>
    </header>
  );
}
