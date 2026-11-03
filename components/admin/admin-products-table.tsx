import Image from "next/image";
import Link from "next/link";
import type { AdminProductListRow } from "@/lib/queries/admin-products";
import { formatPrice } from "@/lib/format";
import { ProductStatusBadge } from "@/components/admin/product-status-badge";
import { VariantQuickStock } from "@/components/admin/variant-quick-stock";
import { DuplicateProductButton } from "@/components/admin/duplicate-product-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const titleLinkClass =
  "font-semibold text-foreground underline-offset-4 hover-fine:hover:underline focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2";

function formatPriceRange(
  minPrice: number | null,
  maxPrice: number | null,
): string {
  if (minPrice === null || maxPrice === null) return "No variants";
  if (minPrice === maxPrice) return formatPrice(minPrice);
  return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`;
}

function Thumbnail({ product }: { product: AdminProductListRow }) {
  const url = product.thumbnail?.url;
  if (!url || url.startsWith("https://placehold.co/")) {
    return (
      <div
        aria-hidden="true"
        className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-muted-foreground"
      >
        AP
      </div>
    );
  }
  return (
    <Image
      alt={product.thumbnail?.alt || product.title}
      className="rounded-lg object-cover"
      height={40}
      width={40}
      src={url}
    />
  );
}

function VariantStockList({ product }: { product: AdminProductListRow }) {
  if (product.variants.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">No variants yet.</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {product.variants.map((variant) => (
        <li
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
          key={variant.id}
        >
          <span className="text-sm">
            {variant.label}
            {variant.sku && (
              <span className="text-muted-foreground ml-1.5 text-xs">
                ({variant.sku})
              </span>
            )}
            <span className="text-muted-foreground ml-1.5 text-xs">
              {formatPrice(variant.price)}
            </span>
          </span>
          <VariantQuickStock
            stock={variant.stock}
            variantId={variant.id}
            variantLabel={variant.label}
          />
        </li>
      ))}
    </ul>
  );
}

function VariantSection({ product }: { product: AdminProductListRow }) {
  return (
    <details className="mt-2">
      <summary className="text-muted-foreground cursor-pointer text-xs font-medium underline-offset-4 hover-fine:hover:underline focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2">
        Stock ({product.variants.length})
      </summary>
      <div className="mt-2">
        <VariantStockList product={product} />
      </div>
    </details>
  );
}

function ProductTitleCell({ product }: { product: AdminProductListRow }) {
  return (
    <div className="flex items-start gap-3">
      <Thumbnail product={product} />
      <div className="min-w-0">
        <Link
          className={titleLinkClass}
          href={`/admin/products/${product.id}`}
        >
          {product.title}
        </Link>
        {product.madeToOrder && (
          <Badge className="ml-2 align-middle" variant="outline">
            Made to order
          </Badge>
        )}
      </div>
    </div>
  );
}

export function AdminProductsTable({
  products,
}: {
  products: AdminProductListRow[];
}) {
  if (products.length === 0) {
    return (
      <p className="border-silver bg-card text-muted-foreground rounded-xl border p-6 text-center text-sm">
        No products match these filters.{" "}
        <Link className="text-foreground underline underline-offset-4" href="/admin/products/new">
          Create the first one
        </Link>
        .
      </p>
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="border-silver bg-card hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <ProductTitleCell product={product} />
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatPriceRange(product.minPrice, product.maxPrice)}
                </TableCell>
                <TableCell className="text-right">
                  {product.madeToOrder ? "—" : product.totalStock}
                </TableCell>
                <TableCell className="max-w-72">
                  <VariantSection product={product} />
                </TableCell>
                <TableCell className="text-right">
                  <DuplicateProductButton productId={product.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {products.map((product) => (
          <li className="border-silver bg-card rounded-xl border p-4" key={product.id}>
            <div className="flex items-start justify-between gap-3">
              <ProductTitleCell product={product} />
              <ProductStatusBadge status={product.status} />
            </div>
            <dl className="text-muted-foreground mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Price</dt>
                <dd className="text-foreground text-right font-semibold">
                  {formatPriceRange(product.minPrice, product.maxPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Total stock</dt>
                <dd className="text-right">
                  {product.madeToOrder ? "Made to order" : product.totalStock}
                </dd>
              </div>
            </dl>
            <VariantSection product={product} />
            <div className="mt-3 flex justify-end">
              <DuplicateProductButton productId={product.id} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
