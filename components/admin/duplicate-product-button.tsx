"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { duplicateAdminProduct } from "@/actions/admin-products";
import { Button } from "@/components/ui/button";

/**
 * Copies a product as a new draft (title + " (copy)", variants, no images) and
 * opens the copy for editing. Used on the admin product list. `className` and
 * `role` are presentational passthroughs so it can sit inside an overflow
 * menu; the action and default rendering are unchanged.
 */
export function DuplicateProductButton({
  productId,
  className,
  role,
}: {
  productId: string;
  className?: string;
  role?: "menuitem";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await duplicateAdminProduct({ productId });
          if (result.success) {
            toast.success(result.message);
            if (result.productId) {
              router.push(`/admin/products/${result.productId}`);
            } else {
              router.refresh();
            }
          } else {
            toast.error(result.message);
          }
        })
      }
      role={role}
      size="sm"
      type="button"
      variant="outline"
    >
      {isPending ? "Copying…" : "Duplicate"}
    </Button>
  );
}
