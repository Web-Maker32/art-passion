import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { listCategoriesForAdmin } from "@/lib/queries/admin-products";
import { AdminProductForm } from "@/components/admin/admin-product-form";

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
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          New product
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create a product, then add at least one variant to publish it.
        </p>
      </div>

      <AdminProductForm
        canDelete={false}
        categories={categories}
        orderedVariantIds={[]}
        product={null}
      />
    </div>
  );
}
