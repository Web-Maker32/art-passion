import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveAdminUserId } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

// cacheComponents: resolveAdminUserId() reads the session cookie and evaluates
// Date.now(), which blocks prerendering. Render this page at request time.
export const instant = false;

export default async function AdminLoginPage() {
  if (await resolveAdminUserId()) {
    redirect("/admin");
  }

  return (
    <main className="bg-background flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="border-silver bg-card shadow-card relative w-full max-w-md rounded-2xl border p-6 sm:p-8">
        <AdminThemeToggle className="absolute top-4 right-4" />
        <div className="flex flex-col items-center text-center">
          <Logo size={64} priority variant="badge" />
          <h1 className="font-heading mt-4 text-2xl font-bold">
            Admin sign in
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Art Passion order management
          </p>
        </div>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
