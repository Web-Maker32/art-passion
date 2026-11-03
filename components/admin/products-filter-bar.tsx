import Link from "next/link";
import { productStatusChoices } from "@/components/admin/product-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";

const controlClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function ProductsFilterBar({
  status,
  search,
}: {
  status: string;
  search: string;
}) {
  return (
    <form
      action="/admin/products"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      method="get"
    >
      <div className="flex flex-col gap-1.5 sm:w-48">
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

      <div className="flex flex-1 flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="products-search">
          Search
        </label>
        <input
          className={controlClass}
          defaultValue={search}
          id="products-search"
          name="search"
          placeholder="Product title"
          type="search"
        />
      </div>

      <div className="flex gap-2">
        <Button className="h-9" type="submit">
          Apply
        </Button>
        <Link
          className={buttonVariants({ variant: "outline", className: "h-9" })}
          href="/admin/products"
        >
          Reset
        </Link>
        <Link
          className={buttonVariants({ className: "h-9" })}
          href="/admin/products/new"
        >
          New product
        </Link>
      </div>
    </form>
  );
}
