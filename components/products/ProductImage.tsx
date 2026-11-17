"use client";

import { ImageIcon } from "lucide-react";
import { getBackendUrl } from "@/lib/api";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";

/**
 * Where the admin can load a product image from. Uploads are full URLs; the website's
 * built-in pictures (e.g. "/product/…webp") live in the website's /public, else the backend.
 */
export const productImageCandidates = (src: string): string[] => {
  if (!src) return [];
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return [src];
  const path = src.startsWith("/") ? src : `/${src}`;
  return [`${PUBLIC_SITE_URL}${path}`, `${getBackendUrl()}${path}`];
};

/** A product picture as the website shows it, or a placeholder when there is none */
export default function ProductImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const candidates = productImageCandidates(src);
  if (!candidates.length) {
    return (
      <div className={`flex items-center justify-center bg-[#F3EDE2] text-[#b8ad9a] ${className}`}>
        <ImageIcon className="h-1/3 max-h-8 w-1/3 max-w-8" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={candidates[0]}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        const next = Number(img.dataset.retry || 0) + 1;
        if (next < candidates.length) {
          img.dataset.retry = String(next);
          img.src = candidates[next];
        }
      }}
    />
  );
}
