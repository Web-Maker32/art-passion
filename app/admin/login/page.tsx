import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveAdminUserId } from "@/lib/admin-auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

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
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="border-silver bg-card w-full max-w-sm rounded-xl border p-6 sm:p-8">
        <h1 className="font-heading text-center text-2xl font-bold">
          Admin sign in
        </h1>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          Art Passion order management
        </p>
        <div className="mt-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
