"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
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
  // Empty alt values in the database fall back to the product name.
  const selectedAlt = selected?.alt || title;
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(event: TouchEvent<HTMLButtonElement>) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent<HTMLButtonElement>) {
    if (touchStartX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    setSelectedIndex((index) =>
      Math.min(images.length - 1, Math.max(0, delta < 0 ? index + 1 : index - 1)),
    );
  }

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
              aria-label={`Zoom image: ${selectedAlt}`}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-muted shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onTouchEnd={handleTouchEnd}
              onTouchStart={handleTouchStart}
              type="button"
            />
          }
        >
          <Image
            alt={selectedAlt}
            className="object-cover"
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 50vw"
            src={selected.url}
          />
          {images.length > 1 && (
            <span
              aria-hidden="true"
              className="bg-brand-deep/70 text-brand-foreground absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm"
            >
              {selectedIndex + 1} / {images.length}
            </span>
          )}
        </DialogTrigger>
        <DialogContent className="h-[min(90vh,56rem)] w-[min(96vw,72rem)] max-w-none border-0 bg-brand p-3 sm:p-6">
          <DialogTitle className="sr-only">{title} enlarged image</DialogTitle>
          <div className="relative h-[calc(90vh-3rem)] w-full">
            <Image
              alt={selectedAlt}
              className="object-contain"
              fill
              sizes="96vw"
              src={selected.url}
            />
          </div>
        </DialogContent>
      </Dialog>
      {images.length > 1 && (
        <div
          aria-label="Product image thumbnails"
          className="scrollbar-brand flex gap-3 overflow-x-auto pb-1"
        >
          {images.map((image, index) => (
            <button
              aria-label={`Show image ${index + 1}: ${image.alt || title}`}
              aria-pressed={index === selectedIndex}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors duration-interaction focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:size-20 ${
                index === selectedIndex
                  ? "border-brand-gold shadow-soft"
                  : "border-silver hover-fine:hover:border-brand"
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
