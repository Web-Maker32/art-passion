import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { io } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();
  await io();
  const pendingCount = await prisma.order.count({
    where: { status: "PENDING" },
  });
  return (
    <div className="min-h-screen min-w-0 lg:pl-64">
      <a
        href="#admin-content"
        className="bg-card text-foreground sr-only rounded-md px-4 py-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to admin content
      </a>
      <AdminHeader pendingCount={pendingCount} />
      <main
        id="admin-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-7xl min-w-0 px-4 py-6 sm:px-6 sm:py-8"
      >
        {children}
      </main>
    </div>
  );
}
