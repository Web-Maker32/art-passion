"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  createAdminCategory,
  renameAdminCategory,
} from "@/actions/admin-categories";
import type { AdminCategoryRow } from "@/lib/admin-category-schema";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/admin-controls";
import { TableCard } from "@/components/admin/admin-cards";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Admin category manager: create a category and rename existing ones inline.
 * Renaming keeps the slug stable (handled server-side), so only the display
 * name is editable here. Deletion is intentionally not offered — categories
 * are referenced by products.
 */
export function CategoriesManager({
  categories,
}: {
  categories: AdminCategoryRow[];
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newName.trim();
    if (name.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    startTransition(async () => {
      const result = await createAdminCategory({ name });
      if (result.success) {
        toast.success(result.message);
        setNewName("");
      } else {
        toast.error(result.message);
      }
    });
  }

  function startRename(category: AdminCategoryRow) {
    setEditingId(category.id);
    setEditName(category.name);
  }

  function cancelRename() {
    setEditingId(null);
    setEditName("");
  }

  function commitRename(id: string) {
    const name = editName.trim();
    if (name.length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    startTransition(async () => {
      const result = await renameAdminCategory({ id, name });
      if (result.success) {
        toast.success(result.message);
        cancelRename();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Slim "New category" card */}
      <form
        className="bg-card flex flex-col gap-3 rounded-[12px] border p-4 sm:flex-row sm:items-end"
        onSubmit={handleCreate}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            className="text-[13px] font-medium"
            htmlFor="new-category-name"
          >
            New category
          </label>
          <AdminInput
            disabled={isPending}
            id="new-category-name"
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. Wall art"
            value={newName}
          />
        </div>
        <Button disabled={isPending} type="submit">
          {isPending ? "Adding…" : "Add category"}
        </Button>
      </form>

      {categories.length === 0 ? (
        <TableCard>
          <AdminEmptyState
            title="No categories yet"
            description="Add your first category using the form above."
          />
        </TableCard>
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Slug</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const isEditing = editingId === category.id;
                return (
                  <TableRow key={category.id}>
                    <TableCell className="max-w-56">
                      {isEditing ? (
                        <AdminInput
                          aria-label={`Rename ${category.name}`}
                          disabled={isPending}
                          onChange={(event) => setEditName(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              commitRename(category.id);
                            } else if (event.key === "Escape") {
                              cancelRename();
                            }
                          }}
                          value={editName}
                        />
                      ) : (
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {category.name}
                          </p>
                          <p className="text-muted-foreground truncate font-mono text-xs sm:hidden">
                            /{category.slug}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden font-mono text-xs sm:table-cell">
                      /{category.slug}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        aria-label={`View products in ${category.name}`}
                        className="text-foreground hover-fine:hover:underline tabular-nums underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                        href={`/admin/products?category=${category.id}`}
                      >
                        {category.productCount === 1
                          ? "1 product"
                          : `${category.productCount} products`}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            disabled={isPending}
                            onClick={() => commitRename(category.id)}
                            size="sm"
                            type="button"
                          >
                            {isPending ? "Saving…" : "Save"}
                          </Button>
                          <Button
                            disabled={isPending}
                            onClick={cancelRename}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          disabled={isPending}
                          onClick={() => startRename(category)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Rename
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </div>
  );
}
