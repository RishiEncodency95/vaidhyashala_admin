"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, Plus, Save } from "lucide-react";
import Swal from "sweetalert2";
import { ApiRequestError } from "@/lib/api";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { productsApi, type Product, type ProductCategory, type ProductInput } from "@/lib/productsApi";
import { FieldLabel, ImageUploadField, SelectField, TextInput, Textarea, Toggle } from "@/components/pages-cms/fields";
import ProductPreview, { POPUP_DEFAULTS } from "./ProductPreview";

/* Add / edit one product of the website's Products page: its card and its "View Details" popup.
   Text limits match the backend (modules/products/products.schema.ts). */

interface FormValues {
  title: string;
  category: string;
  shortDescription: string;
  description: string;
  productType: string;
  packOptions: string;
  availability: string;
  productInfo: string;
  directions: string;
  usageNotes: string;
  image: string;
  imageAlt: string;
  galleryImage1: string;
  galleryImage2: string;
  isActive: boolean;
  order: string;
}

const BLANK: FormValues = {
  title: "",
  category: "",
  shortDescription: "",
  description: "",
  productType: "",
  packOptions: POPUP_DEFAULTS.packOptions,
  availability: POPUP_DEFAULTS.availability,
  productInfo: "",
  directions: "",
  usageNotes: POPUP_DEFAULTS.usageNotes,
  image: "",
  imageAlt: "",
  galleryImage1: "",
  galleryImage2: "",
  isActive: true,
  order: "",
};

const fromProduct = (p: Product): FormValues => ({
  title: p.title ?? "",
  category: p.category?._id ?? "",
  shortDescription: p.shortDescription ?? "",
  description: p.description ?? "",
  productType: p.productType ?? "",
  packOptions: p.packOptions ?? "",
  availability: p.availability ?? "",
  productInfo: p.productInfo ?? "",
  directions: p.directions ?? "",
  usageNotes: p.usageNotes ?? "",
  image: p.image ?? "",
  imageAlt: p.imageAlt ?? "",
  galleryImage1: p.galleryImage1 ?? "",
  galleryImage2: p.galleryImage2 ?? "",
  isActive: p.isActive !== false,
  order: p.order ? String(p.order) : "",
});

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  background: "#1e2433",
  color: "#e2e8f0",
});

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiRequestError || err instanceof Error ? err.message || fallback : fallback;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-[#e8e5df] bg-white">
      <div className="border-b border-[#f0f0ec] px-4 py-3">
        <h2 className="text-[14px] font-bold text-[#23471d]">{title}</h2>
        {hint && <p className="mt-0.5 text-[11.5px] font-medium text-[#6c7587]">{hint}</p>}
      </div>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </section>
  );
}

function Field({ label, required, help, children }: { label: string; required?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      {help && <p className="mt-1 text-[10.5px] font-medium text-[#8a93a3]">{help}</p>}
    </div>
  );
}

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(productId);
  const [values, setValues] = useState<FormValues>(BLANK);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([productsApi.listCategories(), productId ? productsApi.getProduct(productId) : Promise.resolve(null)])
      .then(([cats, product]) => {
        if (cancelled) return;
        setCategories(cats);
        if (product) {
          setValues(fromProduct(product));
          setSlug(product.slug);
        } else {
          setValues((v) => ({ ...v, category: v.category || cats.find((c) => c.isActive)?._id || cats[0]?._id || "" }));
        }
      })
      .catch((err) => !cancelled && setLoadError(errorText(err, "Could not load the product.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const set = <K extends keyof FormValues>(key: K) => (value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  const categoryOptions = useMemo(
    () => [
      ...(values.category ? [] : [{ label: "Select a category…", value: "" }]),
      ...categories.map((c) => ({ label: c.isActive ? c.name : `${c.name} (hidden on website)`, value: c._id })),
    ],
    [categories, values.category],
  );
  const categoryName = categories.find((c) => c._id === values.category)?.name ?? "";
  const selectedCategoryHidden = categories.find((c) => c._id === values.category)?.isActive === false;

  const addCategory = async () => {
    const { value: name } = await Swal.fire({
      title: "New category",
      input: "text",
      inputLabel: "Shown as a filter on the website's Products page",
      inputPlaceholder: "e.g. Therapy Oils",
      showCancelButton: true,
      confirmButtonText: "Add category",
      confirmButtonColor: "#166b40",
      inputValidator: (v) => (!v.trim() ? "Please enter a name" : v.trim().length > 80 ? "Keep it under 80 characters" : null),
    });
    if (!name) return;
    try {
      const created = await productsApi.createCategory({ name: String(name).trim() });
      setCategories((prev) => [...prev, created]);
      set("category")(created._id);
      Toast.fire({ icon: "success", iconColor: "#34d399", title: `Category "${created.name}" added` });
    } catch (err) {
      Swal.fire({ title: "Could not add the category", text: errorText(err, "Please try again."), icon: "error" });
    }
  };

  const validate = (): string | null => {
    if (!values.title.trim()) return "Please enter the product name.";
    if (!values.category) return "Please choose a category (or add one).";
    if (!values.image.trim()) return "Please add the main product image.";
    if (values.order && !/^\d+$/.test(values.order.trim())) return "Display order must be a whole number.";
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      Swal.fire({ title: "Please check the form", text: problem, icon: "warning", confirmButtonColor: "#166b40" });
      return;
    }
    const t = (s: string) => s.trim();
    const payload: ProductInput = {
      title: t(values.title),
      category: values.category,
      shortDescription: t(values.shortDescription),
      description: t(values.description),
      productType: t(values.productType),
      packOptions: t(values.packOptions),
      availability: t(values.availability),
      productInfo: t(values.productInfo),
      directions: t(values.directions),
      usageNotes: values.usageNotes
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n"),
      image: t(values.image),
      imageAlt: t(values.imageAlt),
      galleryImage1: t(values.galleryImage1),
      galleryImage2: t(values.galleryImage2),
      isActive: values.isActive,
      ...(values.order.trim() ? { order: Number(values.order.trim()) } : {}),
    };
    setSaving(true);
    try {
      if (productId) await productsApi.updateProduct(productId, payload);
      else await productsApi.createProduct(payload);
      Toast.fire({ icon: "success", iconColor: "#34d399", title: isEdit ? "Product updated" : "Product added" });
      router.push("/products");
    } catch (err) {
      Swal.fire({ title: "Could not save the product", text: errorText(err, "Please try again."), icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-[13px] text-[#6c7587]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-[13px] font-semibold text-red-600">{loadError}</p>
        <Link href="/products" className="text-[12px] font-bold text-[#166b40] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-[#fbfbfa] text-[#18233b]">
      <div className="px-[18px] pb-[24px] pt-[14px]">
        {/* HEADER */}
        <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3 border-b-[2px] border-[#293681] pb-[10px]">
          <div className="min-w-0">
            <Link href="/products" className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#6c7587] hover:text-[#166b40]">
              <ArrowLeft className="h-3.5 w-3.5" /> Products
            </Link>
            <h1 className="mt-0.5 truncate text-[22px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]">
              {isEdit ? `Edit: ${values.title || "Product"}` : "Add Product"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isEdit && values.isActive && (
              <a
                href={`${PUBLIC_SITE_URL}/products#catalogue`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] border border-[#e5e6e2] bg-white px-3 text-[12px] font-bold text-[#414b5e] hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" /> View on website
              </a>
            )}
            <Link
              href="/products"
              className="inline-flex h-[34px] items-center rounded-[6px] border border-[#e5e6e2] bg-white px-3 text-[12px] font-bold text-[#414b5e] hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] bg-[#166b40] px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#12593a] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* FORM */}
          <div className="min-w-0 space-y-4">
            <Section title="Basic details" hint="Name and category, shown on the product card and at the top of the popup.">
              <Field label="Product name" required>
                <TextInput value={values.title} onChange={set("title")} placeholder="e.g. Ayurvedic Massage Oil" maxLength={160} />
              </Field>
              <Field
                label="Category"
                required
                help={
                  selectedCategoryHidden
                    ? "This category is hidden on the website, so this product will not show until the category is visible again."
                    : "Also used for the filter buttons above the products (All Products, Therapy Oils, …)."
                }
              >
                <div className="flex gap-2">
                  <div className="min-w-0 flex-1">
                    <SelectField value={values.category} options={categoryOptions} onChange={set("category")} />
                  </div>
                  <button
                    type="button"
                    onClick={addCategory}
                    className="inline-flex h-[35px] shrink-0 items-center gap-1 border border-[#0f766e] bg-[#f0fdf4] px-3 text-[11px] font-bold text-[#0f766e] hover:bg-[#dcfce7]"
                  >
                    <Plus className="h-3.5 w-3.5" /> New category
                  </button>
                </div>
              </Field>
              <Field label="Short description (card)" help="1–2 short lines under the name on the product card.">
                <Textarea
                  value={values.shortDescription}
                  onChange={set("shortDescription")}
                  placeholder="e.g. Traditional herbal oils for abhyanga and external use."
                  rows={2}
                  maxLength={300}
                />
              </Field>
            </Section>

            <Section
              title="Images"
              hint="Best size: 1200 × 900 px (4:3), WebP or JPG. Keep the product in the centre — the popup crops the sides to a square."
            >
              <Field label="Main image" required help="Shown on the card and as the first picture in the popup.">
                <ImageUploadField value={values.image} onChange={set("image")} />
              </Field>
              <Field label="Image description (alt text)" help="Describes the picture for search engines and screen readers. Leave empty to use the product name.">
                <TextInput value={values.imageAlt} onChange={set("imageAlt")} placeholder="e.g. Bottle of Ayurvedic massage oil with herbs" maxLength={300} />
              </Field>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Field label="Popup image 2" help="Optional. Another view of the product (pack, label, texture…).">
                  <ImageUploadField value={values.galleryImage1} onChange={set("galleryImage1")} />
                </Field>
                <Field label="Popup image 3" help="Optional. A related image, e.g. the product in use.">
                  <ImageUploadField value={values.galleryImage2} onChange={set("galleryImage2")} />
                </Field>
              </div>
            </Section>

            <Section title="Popup details" hint={`What the "View Details" popup shows next to the images.`}>
              <Field label="Full description" help="Paragraph under the product name in the popup. Leave empty to repeat the short description.">
                <Textarea
                  value={values.description}
                  onChange={set("description")}
                  placeholder="e.g. An Ayurvedic oil preparation for external massage. Ask our team about the formulation, pack options and availability."
                  rows={3}
                  maxLength={2000}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Field label="Product type" help="Hidden when empty.">
                  <TextInput value={values.productType} onChange={set("productType")} placeholder="e.g. External-use oil" maxLength={120} />
                </Field>
                <Field label="Pack options">
                  <TextInput value={values.packOptions} onChange={set("packOptions")} placeholder={POPUP_DEFAULTS.packOptions} maxLength={300} />
                </Field>
                <Field label="Availability">
                  <TextInput value={values.availability} onChange={set("availability")} placeholder={POPUP_DEFAULTS.availability} maxLength={200} />
                </Field>
              </div>
              <Field label="Product information" help={`Text inside the "Product information" box. Leave empty for the standard text.`}>
                <Textarea value={values.productInfo} onChange={set("productInfo")} placeholder={POPUP_DEFAULTS.productInfo} rows={3} maxLength={3000} />
              </Field>
              <Field label="Directions & precautions" help={`Text inside the "Directions & precautions" box. Leave empty for the standard text.`}>
                <Textarea value={values.directions} onChange={set("directions")} placeholder={POPUP_DEFAULTS.directions} rows={3} maxLength={3000} />
              </Field>
              <Field label="Note (green box)" help="One line per line, e.g. a second line “For external use only.” for oils.">
                <Textarea value={values.usageNotes} onChange={set("usageNotes")} placeholder={POPUP_DEFAULTS.usageNotes} rows={2} maxLength={1000} />
              </Field>
            </Section>

            <Section title="Visibility">
              <div className="flex flex-wrap items-start gap-8">
                <div>
                  <FieldLabel>Show on website</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Toggle checked={values.isActive} onChange={set("isActive")} />
                    <span className={`text-[12px] font-bold ${values.isActive ? "text-[#16a34a]" : "text-[#dc2626]"}`}>
                      {values.isActive ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>
                <div className="w-[160px]">
                  <Field label="Display order" help="Lower numbers show first.">
                    <TextInput value={values.order} onChange={set("order")} placeholder="Auto" maxLength={4} hideLimit />
                  </Field>
                </div>
                {slug && (
                  <div>
                    <FieldLabel>Product ID (slug)</FieldLabel>
                    <p className="font-mono text-[11px] text-[#6c7587]">{slug}</p>
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* LIVE PREVIEW */}
          <aside className="min-w-0">
            <div className="rounded-[8px] border border-[#e8e5df] bg-white p-4 xl:sticky xl:top-4">
              <p className="mb-3 text-[13px] font-bold text-[#23471d]">Live preview</p>
              <ProductPreview values={{ ...values, categoryName }} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
