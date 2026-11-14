"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Image as ImageIcon } from "lucide-react";
import { cn } from "cn";
import type { AdminProductListRow } from "@/lib/queries/admin-products";
import { formatPrice } from "@/lib/format";
import { getStockDisplay, type StockDisplay } from "@/lib/admin-display";
import { ProductStatusBadge } from "@/components/admin/product-status-badge";
import { VariantQuickStock } from "@/components/admin/variant-quick-stock";
import { DuplicateProductButton } from "@/components/admin/duplicate-product-button";
import { Chip } from "@/components/admin/chip";
import { TableCard } from "@/components/admin/admin-cards";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  OverflowMenu,
  overflowMenuItemClass,
} from "@/components/admin/overflow-menu";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stockToneClasses: Record<StockDisplay["tone"], string> = {
  fine: "text-status-delivered",
  low: "text-status-pending",
  out: "text-status-cancelled",
  madeToOrder: "text-muted-foreground",
};

function editHref(product: AdminProductListRow): string {
  return `/admin/products/${product.id}`;
}

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
      <span
        aria-hidden="true"
        className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-[8px]"
      >
        <ImageIcon className="size-5" />
      </span>
    );
  }
  return (
    <Image
      alt={product.thumbnail?.alt || product.title}
      className="size-12 shrink-0 rounded-[8px] object-cover"
      height={48}
      width={48}
      src={url}
    />
  );
}

/** 48px thumbnail, semibold name (real anchor to Edit), muted SKU below. */
function ProductIdentity({ product }: { product: AdminProductListRow }) {
  const sku = product.variants.find((variant) => variant.sku)?.sku ?? null;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Thumbnail product={product} />
      <div className="min-w-0">
        <span className="flex min-w-0 items-center gap-2">
          <Link
            className="focus-visible:outline-ring max-w-56 truncate font-semibold underline-offset-4 hover-fine:hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            href={editHref(product)}
            title={product.title}
          >
            {product.title}
          </Link>
          {product.madeToOrder && <Chip tone="gold">Made to order</Chip>}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {sku ?? "No SKU"}
        </span>
      </div>
    </div>
  );
}

function VariantStockList({ product }: { product: AdminProductListRow }) {
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

/** Chip with a custom chevron; inline stock editing stays exactly as it was. */
function VariantExpansion({ product }: { product: AdminProductListRow }) {
  if (product.variants.length === 0) {
    return <span className="text-muted-foreground text-xs">No variants</span>;
  }
  return (
    <details className="group/variants">
      <summary className="border-silver bg-card hover-fine:hover:bg-muted inline-flex h-11 cursor-pointer list-none items-center gap-1.5 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] motion-reduce:transition-none sm:h-8 [&::-webkit-details-marker]:hidden">
        {product.variants.length}{" "}
        {product.variants.length === 1 ? "variant" : "variants"}
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 transition-transform group-open/variants:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="mt-2 min-w-64">
        <VariantStockList product={product} />
      </div>
    </details>
  );
}

function StockLabel({ product }: { product: AdminProductListRow }) {
  const stock = getStockDisplay(product);
  return (
    <span
      className={cn("text-sm font-medium tabular-nums", stockToneClasses[stock.tone])}
    >
      {stock.label}
    </span>
  );
}

function RowActions({ product }: { product: AdminProductListRow }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        className={buttonVariants({ variant: "outline", size: "sm" })}
        href={editHref(product)}
      >
        Edit
      </Link>
      <OverflowMenu label={`More actions for ${product.title}`}>
        <DuplicateProductButton
          className={cn(
            overflowMenuItemClass,
            "h-auto justify-start border-0 bg-transparent shadow-none hover:bg-muted focus-visible:bg-muted dark:bg-transparent dark:hover:bg-muted",
          )}
          productId={product.id}
          role="menuitem"
        />
        {product.status === "PUBLISHED" && (
          <Link
            className={overflowMenuItemClass}
            href={`/products/${product.slug}`}
            rel="noopener noreferrer"
            role="menuitem"
            target="_blank"
          >
            <ExternalLink aria-hidden="true" />
            View on store
          </Link>
        )}
      </OverflowMenu>
    </div>
  );
}

export function AdminProductsTable({
  products,
}: {
  products: AdminProductListRow[];
}) {
  const router = useRouter();

  if (products.length === 0) {
    return (
      <TableCard>
        <AdminEmptyState
          title="No products match these filters"
          description="Try a different search, or reset the filters to see the full catalogue."
          action={
            <>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/admin/products"
              >
                Reset filters
              </Link>
              <Link className={buttonVariants()} href="/admin/products/new">
                + New product
              </Link>
            </>
          }
        />
      </TableCard>
    );
  }

  function onRowClick(
    event: React.MouseEvent<HTMLTableRowElement>,
    product: AdminProductListRow,
  ) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "a, button, input, select, summary, details, label, [role='menuitem']",
      )
    ) {
      return;
    }
    router.push(editHref(product));
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <TableCard className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                className="group/row h-16 cursor-pointer"
                key={product.id}
                onClick={(event) => onRowClick(event, product)}
              >
                <TableCell>
                  <ProductIdentity product={product} />
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <Chip tone="outline">{product.category}</Chip>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatPriceRange(product.minPrice, product.maxPrice)}
                </TableCell>
                <TableCell className="text-right">
                  <StockLabel product={product} />
                </TableCell>
                <TableCell className="max-w-80">
                  <VariantExpansion product={product} />
                </TableCell>
                <TableCell className="text-right">
                  <RowActions product={product} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {products.map((product) => (
          <li className="bg-card rounded-[12px] border p-4" key={product.id}>
            <div className="flex items-start justify-between gap-3">
              <ProductIdentity product={product} />
              <ProductStatusBadge status={product.status} />
            </div>
            <dl className="mt-3 space-y-1 text-sm">
              {product.category && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>
                    <Chip tone="outline">{product.category}</Chip>
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="text-right font-semibold tabular-nums">
                  {formatPriceRange(product.minPrice, product.maxPrice)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Stock</dt>
                <dd className="text-right">
                  <StockLabel product={product} />
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <VariantExpansion product={product} />
            </div>
            <div className="mt-3 flex justify-end">
              <RowActions product={product} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}