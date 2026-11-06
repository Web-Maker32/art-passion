"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  archiveAdminProduct,
  deleteAdminProduct,
  duplicateAdminProduct,
  restoreAdminProduct,
  saveAdminProduct,
  type AdminProductActionResult,
} from "@/actions/admin-products";
import {
  productFormSchema,
  slugifyTitle,
  type ProductFormData,
  type ProductFormInput,
} from "@/lib/admin-product-schema";
import type { AdminProductEdit } from "@/lib/queries/admin-products";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CategoryOption = { id: string; name: string; slug: string };

const typeChoices: Array<{ value: ProductFormData["type"]; label: string }> = [
  { value: "HANDMADE", label: "Handmade" },
  { value: "KIT", label: "Kit" },
  { value: "FELT_SET", label: "Felt set" },
  { value: "GIFT_SET", label: "Gift set" },
  { value: "SUPPLY", label: "Supply" },
];

const statusChoices: Array<{
  value: ProductFormData["status"];
  label: string;
}> = [
  { value: "DRAFT", label: "Draft — not visible in the store" },
  { value: "PUBLISHED", label: "Published — visible in the store" },
  { value: "HIDDEN", label: "Archived — hidden from the store" },
];

const controlClass =
  "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function buildProductFormDefaults(
  product: AdminProductEdit | null,
  categories: CategoryOption[],
): ProductFormInput {
  return {
    title: product?.title ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDescription: product?.shortDescription ?? "",
    whatsIncluded: product?.whatsIncluded ?? [],
    size: product?.size ?? "",
    recommendedAge: product?.recommendedAge ?? "",
    safetyNote: product?.safetyNote ?? "",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    type: product?.type ?? "HANDMADE",
    status: product?.status ?? "DRAFT",
    madeToOrder: product?.madeToOrder ?? false,
    leadTimeDays: product?.leadTimeDays ?? 7,
    materials: product?.materials ?? [],
    tags: product?.tags ?? [],
    variants:
      product?.variants.map((variant) => ({
        variantId: variant.id,
        label: variant.label,
        price: variant.price,
        stock: variant.stock,
        sku: variant.sku ?? "",
      })) ?? [],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-destructive mt-1 text-xs">{message}</p>;
}

export function AdminProductForm({
  product,
  categories,
  orderedVariantIds,
  canDelete,
}: {
  product: AdminProductEdit | null;
  categories: CategoryOption[];
  /** Variant ids that appear in past orders; these cannot be removed. */
  orderedVariantIds: string[];
  /** False when the product appears in orders — hard delete is disabled. */
  canDelete: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState<
    "delete" | "cancel" | null
  >(null);
  const slugEditedRef = useRef(Boolean(product));
  const [materialsText, setMaterialsText] = useState(
    (product?.materials ?? []).join(", "),
  );
  const [tagsText, setTagsText] = useState((product?.tags ?? []).join(", "));
  const [whatsIncludedText, setWhatsIncludedText] = useState(
    (product?.whatsIncluded ?? []).join("\n"),
  );

  const defaults = useMemo(
    () => buildProductFormDefaults(product, categories),
    [product, categories],
  );

  const form = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const variants = useFieldArray({ control, name: "variants" });
  const orderedIds = useMemo(() => new Set(orderedVariantIds), [orderedVariantIds]);
  const watchedVariants = watch("variants");

  const madeToOrder = watch("madeToOrder");
  const busy = isPending || isSubmitting;

  // Warn before leaving the page (refresh/close) with unsaved changes.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirty) {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>) {
    const title = event.target.value;
    setValue("title", title, { shouldDirty: true, shouldValidate: false });
    if (!slugEditedRef.current) {
      setValue("slug", slugifyTitle(title), { shouldDirty: true });
    }
  }

  function applyListErrors(result: AdminProductActionResult) {
    if (result.success || !result.fieldErrors) return;
    for (const [field, message] of Object.entries(result.fieldErrors)) {
      if (field === "slug") {
        setError("slug", { type: "server", message });
      } else if (field.startsWith("variants")) {
        setError("variants", { type: "server", message });
      }
    }
  }

  function onSubmit(data: ProductFormData) {
    const payload = {
      ...data,
      materials: materialsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      tags: tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      whatsIncluded: whatsIncludedText
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      const result = await saveAdminProduct(payload, product?.id);
      if (result.success) {
        toast.success(result.message);
        reset(undefined, { keepValues: true });
        if (!product && result.productId) {
          router.push(`/admin/products/${result.productId}`);
        } else {
          router.refresh();
        }
      } else {
        applyListErrors(result);
        toast.error(result.message);
      }
    });
  }

  function runLifecycleAction(action: "archive" | "restore" | "delete" | "duplicate") {
    if (!product) return;
    startTransition(async () => {
      let result: AdminProductActionResult;
      if (action === "archive") {
        result = await archiveAdminProduct({ productId: product.id });
      } else if (action === "restore") {
        result = await restoreAdminProduct({ productId: product.id });
      } else if (action === "delete") {
        result = await deleteAdminProduct({ productId: product.id });
      } else {
        result = await duplicateAdminProduct({ productId: product.id });
      }

      if (result.success) {
        toast.success(result.message);
        setConfirmDialog(null);
        if (action === "delete") {
          router.push("/admin/products");
        } else if (action === "duplicate" && result.productId) {
          router.push(`/admin/products/${result.productId}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleCancelClick() {
    if (isDirty) {
      setConfirmDialog("cancel");
    } else {
      router.push("/admin/products");
    }
  }

  const isArchived = product?.status === "HIDDEN";

  return (
    <form className="space-y-8" noValidate onSubmit={handleSubmit(onSubmit)}>
      {/* Basics */}
      <section className="border-silver bg-card space-y-4 rounded-xl border p-4 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Product</h2>

        <div className="space-y-1.5">
          <Label htmlFor="product-title">Title</Label>
          <Input
            id="product-title"
            {...register("title", { onChange: handleTitleChange })}
            aria-invalid={Boolean(errors.title)}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-slug">Slug</Label>
          <Input
            id="product-slug"
            {...register("slug", {
              onChange: () => {
                slugEditedRef.current = true;
              },
            })}
            aria-invalid={Boolean(errors.slug)}
            placeholder="felt-rose-kit"
          />
          <p className="text-muted-foreground text-xs">
            Used in the store URL: /products/&lt;slug&gt;. Generated from the
            title until you edit it.
          </p>
          <FieldError message={errors.slug?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-short-description">
            Short description{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="product-short-description"
            rows={2}
            placeholder="One or two lines used in search results and product cards."
            {...register("shortDescription")}
            aria-invalid={Boolean(errors.shortDescription)}
          />
          <FieldError message={errors.shortDescription?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-description">Full description</Label>
          <Textarea
            id="product-description"
            rows={6}
            {...register("description")}
            aria-invalid={Boolean(errors.description)}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="product-category">Category</Label>
            <select
              className={controlClass}
              id="product-category"
              {...register("categoryId")}
              aria-invalid={Boolean(errors.categoryId)}
            >
              {categories.length === 0 && <option value="">No categories</option>}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-type">Type</Label>
            <select
              className={controlClass}
              id="product-type"
              {...register("type")}
              aria-invalid={Boolean(errors.type)}
            >
              {typeChoices.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.type?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-status">Status</Label>
            <select
              className={controlClass}
              id="product-status"
              {...register("status")}
              aria-invalid={Boolean(errors.status)}
            >
              {statusChoices.map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.status?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-materials">
              Materials <span className="text-muted-foreground">(comma separated)</span>
            </Label>
            <Input
              id="product-materials"
              onChange={(event) => setMaterialsText(event.target.value)}
              placeholder="Felt, thread, stuffing"
              value={materialsText}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-tags">
              Tags <span className="text-muted-foreground">(comma separated)</span>
            </Label>
            <Input
              id="product-tags"
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="rose, wedding, gift"
              value={tagsText}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Controller
            control={control}
            name="madeToOrder"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={field.value}
                  id="product-made-to-order"
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Made to order
              </label>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="product-lead-time">Lead time (days)</Label>
            <Input
              className="w-28"
              id="product-lead-time"
              min={1}
              max={365}
              step={1}
              type="number"
              {...register("leadTimeDays", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.leadTimeDays)}
              disabled={!madeToOrder}
            />
            <FieldError message={errors.leadTimeDays?.message} />
          </div>
        </div>
      </section>

      {/* Product page details */}
      <section className="border-silver bg-card space-y-4 rounded-xl border p-4 sm:p-6">
        <div>
          <h2 className="font-heading text-lg font-semibold">Product page details</h2>
          <p className="text-muted-foreground text-sm">
            These appear below the price on the storefront product page.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="product-size">
              Size <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="product-size"
              placeholder="e.g. 20 cm × 15 cm"
              {...register("size")}
              aria-invalid={Boolean(errors.size)}
            />
            <FieldError message={errors.size?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-age">
              Recommended age{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="product-age"
              placeholder="e.g. 3 years and up"
              {...register("recommendedAge")}
              aria-invalid={Boolean(errors.recommendedAge)}
            />
            <FieldError message={errors.recommendedAge?.message} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-included">
            What&apos;s included{" "}
            <span className="text-muted-foreground">(one item per line)</span>
          </Label>
          <Textarea
            id="product-included"
            onChange={(event) => setWhatsIncludedText(event.target.value)}
            placeholder={"Felt animals\nCotton storage bag\nCare card"}
            rows={4}
            value={whatsIncludedText}
          />
          <p className="text-muted-foreground text-xs">
            Shown as a checklist on the product page. Commas also work as
            separators.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="product-safety">
            Safety note <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="product-safety"
            rows={3}
            placeholder="e.g. Contains small parts. Adult supervision recommended."
            {...register("safetyNote")}
            aria-invalid={Boolean(errors.safetyNote)}
          />
          <FieldError message={errors.safetyNote?.message} />
        </div>
      </section>

      {/* Variants */}
      <section className="border-silver bg-card space-y-4 rounded-xl border p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-semibold">Variants</h2>
            <p className="text-muted-foreground text-sm">
              At least one variant is required to publish. Prices are whole
              rupees.
            </p>
          </div>
          <Button
            disabled={busy}
            onClick={() =>
              variants.append({ label: "", price: 0, stock: 0, sku: "" })
            }
            type="button"
            variant="outline"
          >
            Add variant
          </Button>
        </div>
        {errors.variants?.root?.message && (
          <FieldError message={errors.variants.root.message} />
        )}

        {variants.fields.length === 0 && (
          <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
            No variants yet. Add one to be able to publish.
          </p>
        )}

        <ul className="space-y-3">
          {variants.fields.map((field, index) => {
            const dbVariantId = watchedVariants?.[index]?.variantId;
            const isOrdered = Boolean(dbVariantId && orderedIds.has(dbVariantId));
            return (
              <li
                className="border-silver space-y-3 rounded-lg border p-3"
                key={field.id}
              >
                <input type="hidden" {...register(`variants.${index}.variantId` as const)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`variant-label-${index}`}>Label</Label>
                    <Input
                      id={`variant-label-${index}`}
                      placeholder="e.g. Small / Red"
                      {...register(`variants.${index}.label` as const)}
                      aria-invalid={Boolean(
                        errors.variants?.[index]?.label,
                      )}
                    />
                    <FieldError
                      message={errors.variants?.[index]?.label?.message}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`variant-sku-${index}`}>
                      SKU <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id={`variant-sku-${index}`}
                      placeholder="AP-ROSE-S"
                      {...register(`variants.${index}.sku` as const)}
                      aria-invalid={Boolean(errors.variants?.[index]?.sku)}
                    />
                    <FieldError message={errors.variants?.[index]?.sku?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`variant-price-${index}`}>Price (Rs)</Label>
                    <Input
                      id={`variant-price-${index}`}
                      inputMode="numeric"
                      min={1}
                      step={1}
                      type="number"
                      {...register(`variants.${index}.price` as const, {
                        valueAsNumber: true,
                      })}
                      aria-invalid={Boolean(errors.variants?.[index]?.price)}
                    />
                    <FieldError
                      message={errors.variants?.[index]?.price?.message}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`variant-stock-${index}`}>Stock</Label>
                    <Input
                      id={`variant-stock-${index}`}
                      inputMode="numeric"
                      min={0}
                      step={1}
                      type="number"
                      {...register(`variants.${index}.stock` as const, {
                        valueAsNumber: true,
                      })}
                      aria-invalid={Boolean(errors.variants?.[index]?.stock)}
                      disabled={madeToOrder}
                    />
                    <FieldError
                      message={errors.variants?.[index]?.stock?.message}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {isOrdered ? (
                    <p className="text-muted-foreground text-xs">
                      This variant appears in past orders and cannot be removed.
                      Set stock to 0 or archive the product instead.
                    </p>
                  ) : (
                    <span />
                  )}
                  <Button
                    disabled={busy || isOrdered}
                    onClick={() => variants.remove(index)}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Images */}
      {product ? (
        <ProductImageManager
          initialImages={product.images}
          productId={product.id}
        />
      ) : (
        <section className="border-silver bg-card space-y-1 rounded-xl border p-4 sm:p-6">
          <h2 className="font-heading text-lg font-semibold">Images</h2>
          <p className="text-muted-foreground text-sm">
            Save the product first, then add and arrange its images.
          </p>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={busy} type="submit">
          {busy ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
        <Button
          disabled={busy}
          onClick={handleCancelClick}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>

        {product && (
          <>
            <span className="mx-1 hidden h-6 w-px bg-border sm:inline-block" />
            {isArchived ? (
              <Button
                disabled={busy}
                onClick={() => runLifecycleAction("restore")}
                type="button"
                variant="outline"
              >
                Restore &amp; publish
              </Button>
            ) : (
              <Button
                disabled={busy}
                onClick={() => runLifecycleAction("archive")}
                type="button"
                variant="outline"
              >
                Archive
              </Button>
            )}
            <Button
              disabled={busy}
              onClick={() => runLifecycleAction("duplicate")}
              type="button"
              variant="outline"
            >
              Duplicate
            </Button>
            <Button
              disabled={busy || !canDelete}
              onClick={() => setConfirmDialog("delete")}
              type="button"
              variant="destructive"
            >
              Delete
            </Button>
            {!canDelete && (
              <p className="text-muted-foreground text-xs">
                This product appears in past orders — it can only be archived,
                not deleted.
              </p>
            )}
          </>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        Or go back to the{" "}
        <Link className="underline underline-offset-4" href="/admin/products">
          product list
        </Link>
        .
      </p>

      {/* Confirm dialogs */}
      <Dialog
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
        open={confirmDialog !== null}
      >
        <DialogContent className="sm:max-w-md">
          {confirmDialog === "delete" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete product</DialogTitle>
                <DialogDescription>
                  This permanently deletes “{product?.title}”, its variants and
                  its images. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button disabled={busy} variant="outline" />}>
                  Keep product
                </DialogClose>
                <Button
                  disabled={busy}
                  onClick={() => runLifecycleAction("delete")}
                  type="button"
                  variant="destructive"
                >
                  {busy ? "Deleting…" : "Delete forever"}
                </Button>
              </DialogFooter>
            </>
          )}
          {confirmDialog === "cancel" && (
            <>
              <DialogHeader>
                <DialogTitle>Discard unsaved changes?</DialogTitle>
                <DialogDescription>
                  You have changes that have not been saved. Leaving this page
                  will discard them.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Keep editing
                </DialogClose>
                <Button
                  onClick={() => {
                    setConfirmDialog(null);
                    router.push("/admin/products");
                  }}
                  type="button"
                  variant="destructive"
                >
                  Discard changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </form>
  );
}
