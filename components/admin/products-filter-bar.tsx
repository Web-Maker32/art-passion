import Link from "next/link";
import type {
  AdminProductStockFilter,
  CategoryOption,
} from "@/lib/queries/admin-products";
import { ADMIN_PRODUCT_SEARCH_MAX_LENGTH } from "@/lib/queries/admin-products";
import { productStatusChoices } from "@/components/admin/product-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSelect } from "@/components/admin/admin-controls";

export function ProductsFilterBar({
  status,
  search,
  categoryId,
  stock,
  categories,
}: {
  status: string;
  search: string;
  categoryId: string;
  stock: AdminProductStockFilter;
  categories: CategoryOption[];
}) {
  return (
    <form
      action="/admin/products"
      className="bg-card grid gap-3 rounded-[12px] border p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))_auto] xl:items-end"
      method="get"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <label className="text-[13px] font-medium" htmlFor="products-search">
          Search
        </label>
        <AdminSearchInput
          defaultValue={search}
          id="products-search"
          maxLength={ADMIN_PRODUCT_SEARCH_MAX_LENGTH}
          name="search"
          placeholder="Product name or SKU"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" htmlFor="products-status">
          Status
        </label>
        <AdminSelect defaultValue={status} id="products-status" name="status">
          <option value="ALL">All statuses</option>
          {productStatusChoices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </AdminSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" htmlFor="products-category">
          Category
        </label>
        <AdminSelect
          defaultValue={categoryId}
          id="products-category"
          name="category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </AdminSelect>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium" htmlFor="products-stock">
          Stock
        </label>
        <AdminSelect defaultValue={stock} id="products-stock" name="stock">
          <option value="all">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock (1–2)</option>
          <option value="out">Out of stock</option>
        </AdminSelect>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Apply</Button>
        <Link
          className={buttonVariants({ variant: "ghost" })}
          href="/admin/products"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}