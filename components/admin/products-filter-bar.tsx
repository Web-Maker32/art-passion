import Link from "next/link";
import type {
  AdminProductStockFilter,
  CategoryOption,
} from "@/lib/queries/admin-products";
import { productStatusChoices } from "@/components/admin/product-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";

const controlClass =
  "h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

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
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,11rem))_auto]"
      method="get"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="products-search">
          Search
        </label>
        <input
          className={controlClass}
          defaultValue={search}
          id="products-search"
          maxLength={64}
          name="search"
          placeholder="Product name or SKU"
          type="search"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="products-status">
          Status
        </label>
        <select
          className={controlClass}
          defaultValue={status}
          id="products-status"
          name="status"
        >
          <option value="ALL">All statuses</option>
          {productStatusChoices.map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="products-category">
          Category
        </label>
        <select
          className={controlClass}
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
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="products-stock">
          Stock
        </label>
        <select
          className={controlClass}
          defaultValue={stock}
          id="products-stock"
          name="stock"
        >
          <option value="all">Any stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock (1–2)</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="flex items-end gap-2">
        <Button className="min-h-11" type="submit">
          Apply
        </Button>
        <Link
          className={buttonVariants({
            variant: "outline",
            className: "min-h-11",
          })}
          href="/admin/products"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
