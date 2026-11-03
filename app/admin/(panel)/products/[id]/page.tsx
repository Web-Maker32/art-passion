import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderedVariantIds } from "@/lib/admin-products";
import {
  getAdminProduct,
  listCategoriesForAdmin,
} from "@/lib/queries/admin-products";
import { buttonVariants } from "@/components/ui/button";
import { AdminProductForm } from "@/components/admin/admin-product-form";

export const metadata: Metadata = {
  title: "Edit product",
  robots: { index: false, follow: false },
};

// Dynamic route + cacheComponents: the root layout's client header uses
// usePathname(), which blocks prerendering. Render this page at request time.
export const instant = false;

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [product, categories] = await Promise.all([
    getAdminProduct(id),
    listCategoriesForAdmin(),
  ]);

  if (!product) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-2xl font-bold">Product not found</h1>
        <p className="text-muted-foreground text-sm">
          No product matches this id.
        </p>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/products"
        >
          Back to products
        </Link>
      </div>
    );
  }

  const orderedVariantIds = Array.from(
    await getOrderedVariantIds(product.variants.map((variant) => variant.id)),
  );
  const canDelete = orderedVariantIds.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Edit product
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{product.title}</p>
      </div>

      <AdminProductForm
        canDelete={canDelete}
        categories={categories}
        orderedVariantIds={orderedVariantIds}
        product={product}
      />
    </div>
  );
}
