"use client";

import { useMemo, useState } from "react";
import { resolveUploadUrl } from "@/lib/urls";

type ServiceGalleryProps = {
  images: string[];
};

export default function ServiceGallery({ images }: ServiceGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = useMemo(
    () => resolveUploadUrl(images[activeIndex] || images[0]),
    [activeIndex, images]
  );

  if (!images.length) return null;

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-blue-900/10">
        <img
          src={activeImage}
          alt="Service gallery"
          className="h-[480px] w-full object-cover"
        />
        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) => (prev - 1 + images.length) % images.length)
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/95 px-3 py-2 text-sm shadow"
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setActiveIndex((prev) => (prev + 1) % images.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/95 px-3 py-2 text-sm shadow"
          aria-label="Next image"
        >
          ›
        </button>
        <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {activeIndex + 1}/{images.length}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, index) => (
          <button
            key={`${src}-${index}`}
            onClick={() => setActiveIndex(index)}
            className={`h-16 w-20 overflow-hidden rounded-lg border ${
              index === activeIndex
                ? "border-red-400 ring-2 ring-red-200"
                : "border-slate-200"
            }`}
          >
            <img
              src={resolveUploadUrl(src)}
              alt={`Thumb ${index + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
