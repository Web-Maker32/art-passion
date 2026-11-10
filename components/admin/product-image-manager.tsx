"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  deleteProductImage,
  moveProductImage,
  setPrimaryProductImage,
  updateProductImageAlt,
} from "@/actions/admin-images";
import {
  IMAGE_SIZE_MESSAGE,
  type ImageUploadResult,
  MAX_IMAGES_PER_PRODUCT,
  validateImageFile,
  type ProductImageItem,
} from "@/lib/image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type UploadRow = {
  localId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "error";
  error?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

const uploadButtonClass =
  "inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover-fine:hover:bg-primary-hover focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2";

/** Kept outside the component so the React Compiler does not treat the
 * time/random fallback as render-time impurity. */
function createUploadId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

/** Same-origin authenticated upload with progress and hosting-error handling. */
export function uploadAdminImage(
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<ImageUploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/api/images/upload");
    xhr.setRequestHeader("X-Admin-Upload", "1");
    xhr.timeout = 60_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    const fail = (message: string) => resolve({ success: false, code: "upload_failed", message });
    xhr.onload = () => {
      if (xhr.status === 413) { fail(IMAGE_SIZE_MESSAGE); return; }
      try {
        const parsed: ImageUploadResult = JSON.parse(xhr.responseText);
        if (xhr.status === 201 && parsed.success && Array.isArray(parsed.images)) { resolve(parsed); return; }
        if (!parsed.success && typeof parsed.message === "string") { resolve(parsed); return; }
      } catch { /* Hosting errors may not be JSON. */ }
      fail("Image upload failed. Please try again.");
    };
    xhr.onerror = () => fail("Network error during upload. Please try again.");
    xhr.ontimeout = () => fail("Upload timed out. Refresh the images before trying again.");
    xhr.onabort = () => fail("Upload cancelled.");
    xhr.send(form);
  });
}

export function ProductImageManager({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: ProductImageItem[];
}) {
  const [images, setImages] = useState<ProductImageItem[]>(initialImages);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<ProductImageItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const countRef = useRef(initialImages.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_IMAGES_PER_PRODUCT - images.length;

  function patchUpload(localId: string, patch: Partial<UploadRow>) {
    setUploads((rows) =>
      rows.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
    );
  }

  function removeUpload(localId: string) {
    setUploads((rows) => rows.filter((row) => row.localId !== localId));
  }

  async function uploadFile(file: File) {
    const localId = createUploadId();

    const reason = validateImageFile(file.type, file.size);
    if (reason) {
      setUploads((rows) => [
        ...rows,
        { localId, fileName: file.name, progress: 0, status: "error", error: reason },
      ]);
      return;
    }
    if (countRef.current >= MAX_IMAGES_PER_PRODUCT) {
      setUploads((rows) => [
        ...rows,
        {
          localId,
          fileName: file.name,
          progress: 0,
          status: "error",
          error: `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.`,
        },
      ]);
      return;
    }

    setUploads((rows) => [
      ...rows,
      { localId, fileName: file.name, progress: 0, status: "uploading" },
    ]);

    const form = new FormData();
    form.append("productId", productId);
    form.append("file", file);
    const commit = await uploadAdminImage(form, (percent) => patchUpload(localId, { progress: percent }));
    if (!commit.success) {
      patchUpload(localId, { status: "error", error: commit.message });
      return;
    }

    countRef.current = commit.images.length;
    setImages(commit.images);
    removeUpload(localId);
    toast.success("Image added.");
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // allow re-selecting the same file
    for (const file of files) {
      await uploadFile(file);
    }
  }

  function runMutation(
    action: () => Promise<{ success: boolean; message: string; images?: ProductImageItem[] }>,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        if (result.images) {
          countRef.current = result.images.length;
          setImages(result.images);
        }
        toast.success(result.message);
        setConfirmDelete(null);
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleAltBlur(image: ProductImageItem, value: string) {
    const nextAlt = value.trim();
    if (nextAlt === image.alt) return;
    runMutation(() =>
      updateProductImageAlt({ imageId: image.id, alt: nextAlt }),
    );
  }

  return (
    <section className="border-silver bg-card space-y-4 rounded-xl border p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold">Images</h2>
          <p className="text-muted-foreground text-sm">
            JPEG, PNG or WebP, up to 4 MB (4,000,000 bytes)
            each, max {MAX_IMAGES_PER_PRODUCT} per product. Alt text is required
            to publish.
          </p>
        </div>
        <div>
          <input
            aria-describedby="image-upload-hint"
            className="sr-only peer"
            disabled={remaining <= 0 || isPending || uploads.some((row) => row.status === "uploading")}
            id="product-image-upload"
            multiple
            onChange={handleFiles}
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
          />
          <label
            className={`${uploadButtonClass} ${remaining <= 0 ? "pointer-events-none opacity-50" : ""}`}
            htmlFor="product-image-upload"
          >
            Add images
          </label>
        </div>
      </div>
      <p className="text-muted-foreground sr-only" id="image-upload-hint">
        {remaining > 0
          ? `You can add ${remaining} more image${remaining === 1 ? "" : "s"}.`
          : "Image limit reached. Delete an image to add another."}
      </p>

      {images.length === 0 && uploads.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
          No images yet. Uploaded images appear here.
        </p>
      )}

      {/* In-progress and failed uploads */}
      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((upload) => (
            <li
              className="border-silver rounded-lg border p-3"
              key={upload.localId}
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{upload.fileName}</span>
                {upload.status === "error" ? (
                  <Button
                    onClick={() => removeUpload(upload.localId)}
                    size="xs"
                    type="button"
                    variant="outline"
                  >
                    Dismiss
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    {upload.progress}%
                  </span>
                )}
              </div>
              {upload.status === "uploading" ? (
                <div
                  aria-hidden="true"
                  className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full"
                >
                  <div
                    className="bg-primary h-full rounded-full transition-[width] duration-interaction ease-interaction motion-reduce:transition-none"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-destructive mt-1 text-xs">{upload.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Stored images */}
      {images.length > 0 && (
        <ul className="space-y-3">
          {images.map((image, index) => (
            <li className="border-silver rounded-lg border p-3" key={image.id}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="bg-muted relative size-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    alt={image.alt || "Product image"}
                    className="object-cover"
                    fill
                    sizes="96px"
                    src={image.url}
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {image.isPrimary && <Badge variant="secondary">Primary</Badge>}
                    <span className="text-muted-foreground text-xs">
                      Position {index + 1} of {images.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`image-alt-${image.id}`}>Alt text</Label>
                    <Input
                      defaultValue={image.alt}
                      id={`image-alt-${image.id}`}
                      maxLength={300}
                      key={image.id}
                      onBlur={(event) => handleAltBlur(image, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          event.currentTarget.blur();
                        }
                      }}
                      placeholder="Describe the image for screen readers"
                    />
                    {!image.alt && (
                      <p className="text-muted-foreground text-xs">
                        Required before this product can be published.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      disabled={isPending || index === 0}
                      onClick={() =>
                        runMutation(() =>
                          moveProductImage({ imageId: image.id, direction: "up" }),
                        )
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Move up
                    </Button>
                    <Button
                      disabled={isPending || index === images.length - 1}
                      onClick={() =>
                        runMutation(() =>
                          moveProductImage({ imageId: image.id, direction: "down" }),
                        )
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Move down
                    </Button>
                    {!image.isPrimary && (
                      <Button
                        disabled={isPending}
                        onClick={() =>
                          runMutation(() =>
                            setPrimaryProductImage({ imageId: image.id }),
                          )
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Make primary
                      </Button>
                    )}
                    <Button
                      disabled={isPending}
                      onClick={() => setConfirmDelete(image)}
                      size="sm"
                      type="button"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        open={confirmDelete !== null}
      >
        <DialogContent className="sm:max-w-md">
          {confirmDelete && (
            <>
              <DialogHeader>
                <DialogTitle>Delete image</DialogTitle>
                <DialogDescription>
                  This removes the image from Cloudinary and from this product.
                  This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button disabled={isPending} variant="outline" />}>
                  Keep image
                </DialogClose>
                <Button
                  disabled={isPending}
                  onClick={() =>
                    runMutation(() =>
                      deleteProductImage({ imageId: confirmDelete.id }),
                    )
                  }
                  type="button"
                  variant="destructive"
                >
                  {isPending ? "Deleting…" : "Delete image"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
