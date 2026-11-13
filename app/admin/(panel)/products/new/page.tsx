import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { listCategoriesForAdmin } from "@/lib/queries/admin-products";
import { AdminProductForm } from "@/components/admin/admin-product-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const metadata: Metadata = {
  title: "New product",
  robots: { index: false, follow: false },
};

// cacheComponents: requireAdmin() reads the session cookie and evaluates
// Date.now(), which blocks prerendering. Render this page at request time.
export const instant = false;

export default async function AdminNewProductPage() {
  await requireAdmin();
  const categories = await listCategoriesForAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New product"
        description="Create a product, then add at least one variant to publish it."
      />

      <AdminProductForm
        canDelete={false}
        categories={categories}
        orderedVariantIds={[]}
        product={null}
      />
    </div>
  );
}
