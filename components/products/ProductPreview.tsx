"use client";

import { useState } from "react";
import { ArrowRight, Calendar, Info, Leaf, Package } from "lucide-react";
import ProductImage from "./ProductImage";

/** What the website's product popup shows for an empty field (keep in step with the website's ProductDetailModal) */
export const POPUP_DEFAULTS = {
  packOptions: "Confirm with the clinic",
  availability: "Enquire with our team",
  productInfo: "Details of the available formulation and manufacturer will be shared by our clinic team.",
  directions:
    "Use as directed by your physician or as indicated on the pack label. Store in a cool, dry place away from direct sunlight.",
  usageNotes: "Use as directed by the product label or your treating doctor.",
};

export interface ProductPreviewValues {
  title: string;
  categoryName: string;
  shortDescription: string;
  description: string;
  productType: string;
  packOptions: string;
  availability: string;
  usageNotes: string;
  image: string;
  imageAlt: string;
  galleryImage1: string;
  galleryImage2: string;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#6c7587]">{children}</p>
);

/** Live look of the product's card and popup on the website's Products page */
export default function ProductPreview({ values }: { values: ProductPreviewValues }) {
  const [active, setActive] = useState(0);
  const images = [values.image, values.galleryImage1, values.galleryImage2].filter(Boolean);
  const shown = images[Math.min(active, images.length - 1)] ?? "";
  const title = values.title || "Product name";
  const category = (values.categoryName || "Category").toUpperCase();
  const cardText = values.shortDescription || values.description || "Short description shown on the card.";
  const popupText = values.description || values.shortDescription || "Full description shown in the popup.";
  const notes = (values.usageNotes || POPUP_DEFAULTS.usageNotes).split("\n").map((l) => l.trim()).filter(Boolean);

  const attributes = [
    { icon: Leaf, label: "Product type", value: values.productType },
    { icon: Package, label: "Pack options", value: values.packOptions || POPUP_DEFAULTS.packOptions },
    { icon: Calendar, label: "Availability", value: values.availability || POPUP_DEFAULTS.availability },
  ].filter((a) => a.value);

  return (
    <div className="space-y-4">
      {/* Card */}
      <div>
        <Label>Card on the Products page</Label>
        <div className="rounded-lg border border-[#ece6db] bg-[#FAF8F3] p-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#E6DFD1] bg-[#F3EDE2]">
            <ProductImage src={values.image} alt={values.imageAlt || title} className="h-full w-full object-cover" />
          </div>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[1.2px] text-[#A58351]">{category}</p>
          <p className="mt-0.5 font-serif text-[16px] font-medium leading-snug text-[#0D3226]">{title}</p>
          <p className="mt-1 line-clamp-2 text-[12px] font-medium leading-[1.5] text-[#4A5950]">{cardText}</p>
          <span className="mt-2 inline-flex items-center gap-1 border-b border-[#C5A265] pb-0.5 text-[12px] font-medium text-[#0D3226]">
            View Details <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Popup */}
      <div>
        <Label>Popup after &quot;View Details&quot;</Label>
        <div className="rounded-lg border border-[#ECE5D8] bg-white p-3">
          <div className="relative aspect-[4/4.1] w-full overflow-hidden rounded-lg border border-[#E6DFD1] bg-[#F7F4EC]">
            <ProductImage src={shown} alt={values.imageAlt || title} className="h-full w-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <button
                  key={`${i}-${src}`}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative aspect-square overflow-hidden rounded-md ${
                    i === Math.min(active, images.length - 1) ? "border-2 border-[#0D382B]" : "border border-[#DFD7CB] opacity-80"
                  }`}
                >
                  <ProductImage src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[1.2px] text-[#A07038]">{category}</p>
          <p className="mt-0.5 font-serif text-[20px] font-medium leading-tight text-[#0A291F]">{title}</p>
          <p className="mt-1 whitespace-pre-line text-[12px] leading-[1.55] text-[#4A5950]">{popupText}</p>
          <div className="my-2.5 border-t border-[#ECE5D8]" />
          <div className="space-y-2">
            {attributes.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#D5CDC0] bg-[#FAF8F3] text-[#2D5A45]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-[#1F3D31]">{label}</span>
                  <span className="block truncate text-[11.5px] text-[#55645C]">{value}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-lg border border-[#ECE5D8] bg-[#F4F1EA] px-3 py-2 text-[11.5px] font-bold text-[#0A291F]">
            Product information
          </div>
          <div className="mt-1.5 rounded-lg border border-[#ECE5D8] bg-[#FAF8F3] px-3 py-2 text-[11.5px] font-bold text-[#0A291F]">
            Directions &amp; precautions
          </div>
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#D5E3D8] bg-[#EDF3EE] p-2.5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2C5A42]" />
            <div className="text-[11px] font-medium leading-[1.5] text-[#244E38]">
              {notes.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
