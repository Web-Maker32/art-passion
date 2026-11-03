"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createAdminCategory,
  renameAdminCategory,
} from "@/actions/admin-categories";
import type { AdminCategoryRow } from "@/lib/admin-category-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <form
        className="border-silver bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end"
        onSubmit={handleCreate}
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="new-category-name">
            New category
          </label>
          <Input
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
        <p className="border-silver bg-card text-muted-foreground rounded-xl border p-6 text-center text-sm">
          No categories yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => {
            const isEditing = editingId === category.id;
            return (
              <li
                className="border-silver bg-card rounded-xl border p-4"
                key={category.id}
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input
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
                    <div className="flex gap-2">
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
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{category.name}</p>
                      <p className="text-muted-foreground text-xs">
                        /{category.slug} ·{" "}
                        {category.productCount === 1
                          ? "1 product"
                          : `${category.productCount} products`}
                      </p>
                    </div>
                    <Button
                      disabled={isPending}
                      onClick={() => startRename(category)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Rename
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
