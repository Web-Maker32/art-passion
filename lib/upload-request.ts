import "server-only";
import { z } from "zod";
import { detectImageMime, IMAGE_SIZE_MESSAGE, MAX_FILE_BYTES, MAX_UPLOAD_BODY_BYTES, uploadProductSchema, validateImageFile } from "@/lib/image-upload";

export class UploadRequestError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function checkUploadOrigin(request: Request): void {
  const site = request.headers.get("sec-fetch-site");
  if (request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("x-admin-upload") !== "1" ||
    (site !== null && site !== "same-origin" && site !== "none")) {
    throw new UploadRequestError(403, "csrf", "Upload requests must come from this admin page.");
  }
}

export async function readImageUpload(request: Request) {
  const length = request.headers.get("content-length");
  if (length !== null) {
    if (!/^\d{1,16}$/.test(length)) throw new UploadRequestError(400, "invalid_request", "Invalid upload length.");
    if (Number(length) > MAX_UPLOAD_BODY_BYTES) {
      await request.body?.cancel().catch(() => {});
      throw new UploadRequestError(413, "too_large", IMAGE_SIZE_MESSAGE);
    }
  }
  const contentType = z.string().max(512).regex(/^multipart\/form-data;\s*boundary=/i).safeParse(request.headers.get("content-type"));
  if (!contentType.success || !request.body) throw new UploadRequestError(400, "invalid_request", "Choose one image to upload.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_UPLOAD_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw new UploadRequestError(413, "too_large", IMAGE_SIZE_MESSAGE);
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  let form: FormData;
  try {
    const body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    form = await new Response(body, { headers: { "Content-Type": contentType.data } }).formData();
  } catch {
    throw new UploadRequestError(400, "invalid_request", "The upload could not be read.");
  }
  if (Array.from(form.keys()).length !== 2 || form.getAll("file").length !== 1 || form.getAll("productId").length !== 1) {
    throw new UploadRequestError(400, "invalid_request", "Send exactly one product and one image.");
  }
  const product = uploadProductSchema.safeParse({ productId: form.get("productId") });
  const file = form.get("file");
  if (!product.success || !file || typeof file === "string") throw new UploadRequestError(400, "invalid_request", "Choose a valid product and image.");
  const oversize = file.size > MAX_FILE_BYTES;
  const reason = validateImageFile(file.type, file.size);
  if (reason) {
    throw new UploadRequestError(oversize ? 413 : file.size === 0 ? 400 : 415,
      oversize ? "too_large" : "invalid_image", reason);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_FILE_BYTES) throw new UploadRequestError(413, "too_large", IMAGE_SIZE_MESSAGE);
  const mimeType = detectImageMime(bytes);
  if (!mimeType || mimeType !== file.type) throw new UploadRequestError(415, "wrong_type", "Only genuine JPEG, PNG and WebP images with matching file types are allowed.");
  return { productId: product.data.productId, bytes, mimeType };
}
