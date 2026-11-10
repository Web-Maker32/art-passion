import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function revalidateImagePaths(productId: string): Promise<void> {
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/products");
  revalidatePath("/");
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  if (product) revalidatePath(`/products/${product.slug}`);
}
