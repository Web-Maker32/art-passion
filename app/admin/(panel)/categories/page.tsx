import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminCategories } from "@/lib/admin-categories";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

// cacheComponents: requireAdmin() reads the session cookie and evaluates
// Date.now(), which blocks prerendering. Render this page at request time.
export const instant = false;

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await listAdminCategories();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        description="Add categories or rename existing ones. The URL slug stays the same when you rename, so existing links keep working."
      />

      <CategoriesManager categories={categories} />
    </div>
  );
}
