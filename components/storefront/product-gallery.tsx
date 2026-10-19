"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ProductDetailData } from "@/lib/queries/products";

export function ProductGallery({
  images,
  title,
}: {
  images: ProductDetailData["images"];
  title: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const selected = images[selectedIndex];

  if (!selected) {
    return (
      <div
        aria-label={`${title}, image unavailable`}
        className="flex aspect-square items-center justify-center rounded-2xl bg-gold-teal-gradient p-6 text-center text-xl font-semibold"
        role="img"
      >
        {title}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Dialog onOpenChange={setZoomed} open={zoomed}>
        <DialogTrigger
          render={
            <button
              aria-label={`Zoom image: ${selected.alt}`}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              type="button"
            />
          }
        >
          <Image
            alt={selected.alt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            src={selected.url}
          />
        </DialogTrigger>
        <DialogContent className="h-[min(90vh,56rem)] w-[min(96vw,72rem)] max-w-none border-0 bg-brand p-3 sm:p-6">
          <DialogTitle className="sr-only">{title} enlarged image</DialogTitle>
          <div className="relative h-[calc(90vh-3rem)] w-full">
            <Image
              alt={selected.alt}
              className="object-contain"
              fill
              sizes="96vw"
              src={selected.url}
            />
          </div>
        </DialogContent>
      </Dialog>
      {images.length > 1 && (
        <div aria-label="Product image thumbnails" className="flex gap-3">
          {images.map((image, index) => (
            <button
              aria-label={`Show image ${index + 1}: ${image.alt}`}
              aria-pressed={index === selectedIndex}
              className={`relative size-16 overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-20 ${
                index === selectedIndex ? "border-brand" : "border-silver"
              }`}
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="80px"
                src={image.url}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
