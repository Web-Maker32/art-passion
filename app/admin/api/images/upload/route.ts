import { assertAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { storage, type VerifiedImageAsset } from "@/lib/storage";
import { commitProductImage } from "@/lib/product-images";
import { revalidateImagePaths } from "@/lib/revalidate-product-images";
import { checkUploadOrigin, readImageUpload, UploadRequestError } from "@/lib/upload-request";
import { logger } from "@/lib/logger";
import type { ImageUploadResult } from "@/lib/image-upload";

function respond(body: ImageUploadResult, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
function failure(status: number, code: string, message: string) {
  return respond({ success: false, code, message }, status);
}
async function cleanup(asset: VerifiedImageAsset) {
  try {
    if (!(await storage.destroyImage(asset.publicId)).ok) logger.warn("upload_cleanup_failed");
  } catch { logger.warn("upload_cleanup_failed"); }
}

export async function POST(request: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.authorized) return failure(401, "unauthenticated", "Your session expired. Please sign in again.");
    checkUploadOrigin(request);
    const input = await readImageUpload(request);
    const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true } });
    if (!product) return failure(404, "not_found", "That product could not be found.");
    let asset: VerifiedImageAsset;
    try { asset = await storage.uploadImage(input.bytes, input.mimeType); }
    catch {
      logger.warn("upload_failed");
      return failure(502, "upload_failed", "Image upload failed. Please try again.");
    }
    let saved;
    try { saved = await commitProductImage({ productId: input.productId, asset }); }
    catch {
      // Reconcile before deletion when the transaction's outcome was not returned.
      try {
        const committed = await prisma.productImage.findFirst({ where: { publicId: asset.publicId }, select: { id: true } });
        if (!committed) await cleanup(asset);
      } catch { logger.warn("upload_cleanup_failed"); }
      return failure(503, "save_failed", "The image could not be confirmed saved. Refresh the images before trying again.");
    }
    if (saved.status !== "ok") {
      await cleanup(asset);
      return failure(saved.status === "not_found" ? 404 : 409, saved.status, saved.message);
    }
    // A cache failure must never turn a committed image into a deleted asset.
    try { await revalidateImagePaths(input.productId); }
    catch { logger.warn("revalidation_failed"); }
    return respond({ success: true, message: saved.message, images: saved.images }, 201);
  } catch (error) {
    if (error instanceof UploadRequestError) return failure(error.status, error.code, error.message);
    logger.warn("upload_failed");
    return failure(503, "unavailable", "Image uploads are temporarily unavailable. Please try again.");
  }
}
