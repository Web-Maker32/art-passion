import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { Container } from "@/components/storefront/container";

export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      <AdminHeader />
      <Container className="flex-1 py-6 sm:py-8">{children}</Container>
    </div>
  );
}
