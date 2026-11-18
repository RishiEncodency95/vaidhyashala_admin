"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, ExternalLink, Loader2, Pencil, Plus, Search, Tags, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { ApiRequestError } from "@/lib/api";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { productsApi, type Product, type ProductCategory } from "@/lib/productsApi";
import { Toggle } from "@/components/pages-cms/fields";
import ProductImage from "@/components/products/ProductImage";
import ProductCategoriesModal from "@/components/products/ProductCategoriesModal";

/* Products of the website's Products page (cards + product pages). Backend: /api/cms/products */

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

const TH = "whitespace-nowrap px-[10px] py-[7px] text-[10.5px] font-bold uppercase tracking-wide text-white";
const TABS = [
  { key: "all", label: "All Products" },
  { key: "visible", label: "Visible" },
  { key: "hidden", label: "Hidden" },
] as const;

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([productsApi.listProducts(), productsApi.listCategories()]);
      setProducts(prods.items);
      setCategories(cats);
      setLoadError("");
    } catch (err) {
      setLoadError(errorText(err, "Could not load the products."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // First load: the state already starts as loading
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: products.length,
      visible: products.filter((p) => p.isActive).length,
      hidden: products.filter((p) => !p.isActive).length,
    }),
    [products],
  );

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (tab === "visible" && !p.isActive) return false;
      if (tab === "hidden" && p.isActive) return false;
      if (categoryFilter && p.category?._id !== categoryFilter) return false;
      if (!q) return true;
      return [p.title, p.shortDescription, p.description, p.productType, p.category?.name]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [products, tab, categoryFilter, search]);

  const toggleVisible = async (product: Product, isActive: boolean) => {
    setBusyId(product._id);
    setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isActive } : p)));
    try {
      await productsApi.updateProduct(product._id, { isActive });
      Toast.fire({ icon: "success", iconColor: "#34d399", title: isActive ? "Shown on website" : "Hidden from website" });
    } catch (err) {
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isActive: !isActive } : p)));
      Toast.fire({ icon: "error", iconColor: "#f87171", title: errorText(err, "Could not update the product.") });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (product: Product) => {
    const result = await Swal.fire({
      title: `Delete "${product.title}"?`,
      text: "It will be removed from the website. This cannot be undone — to keep it, hide it instead.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    setBusyId(product._id);
    try {
      await productsApi.deleteProduct(product._id);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
      Toast.fire({ icon: "success", iconColor: "#34d399", title: "Product deleted" });
    } catch (err) {
      Swal.fire({ title: "Could not delete the product", text: errorText(err, "Please try again."), icon: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const importDefaults = async () => {
    setImporting(true);
    try {
      const res = await productsApi.importDefaults();
      await load();
      Toast.fire({
        icon: "success",
        iconColor: "#34d399",
        title: `Imported ${res.productsCreated} products and ${res.categoriesCreated} categories`,
      });
    } catch (err) {
      Swal.fire({ title: "Could not import the products", text: errorText(err, "Please try again."), icon: "error" });
    } finally {
      setImporting(false);
    }
  };

  const headerButton =
    "inline-flex h-[34px] items-center gap-1.5 rounded-[6px] border border-[#e5e6e2] bg-white px-3 text-[12px] font-bold text-[#414b5e] transition hover:bg-slate-50";

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]">
      <div className="flex min-h-full flex-col px-[18px] pb-[16px] pt-[14px]">
        {/* HEADER */}
        <div className="mb-[14px] flex flex-wrap items-start justify-between gap-[10px] border-b-[2px] border-[#293681] pb-[10px]">
          <div>
            <h1 className="text-[22px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]">Products</h1>
            <p className="mt-0.5 text-[12px] font-medium text-[#6c7587]">
              The product cards on the website&apos;s Products page and their product pages, with price and discount.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setCategoriesOpen(true)} className={headerButton}>
              <Tags className="h-3.5 w-3.5" /> Categories ({categories.length})
            </button>
            <a href={`${PUBLIC_SITE_URL}/products#catalogue`} target="_blank" rel="noreferrer" className={headerButton}>
              <ExternalLink className="h-3.5 w-3.5" /> View on website
            </a>
            <Link
              href="/products/new"
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] bg-[#166b40] px-4 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#12593a]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Link>
          </div>
        </div>

        {/* EMPTY DATABASE: the website still shows its built-in products */}
        {!loading && !loadError && products.length === 0 && (
          <div className="mb-[14px] flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="max-w-[720px] text-[12.5px] font-medium leading-[1.5] text-amber-900">
              No products have been added yet, so the website is showing its 12 built-in products. Import them to edit them here.
              <br />
              <span className="font-bold">Note:</span> once any product is added here, the website shows only the products in this list.
            </p>
            <button
              type="button"
              onClick={importDefaults}
              disabled={importing}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-[6px] bg-amber-600 px-4 text-[12px] font-bold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Import website products
            </button>
          </div>
        )}

        {/* TABLE CARD */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[7px] border border-[#e8e5df] bg-white">
          {/* TABS */}
          <div className="flex flex-wrap items-center gap-[20px] border-b border-[#e8e5df] px-[16px] pt-[11px]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`relative pb-[9px] text-[12.5px] font-bold transition-colors ${tab === t.key ? "text-[#166b40]" : "text-[#6c7587] hover:text-[#18233b]"}`}
              >
                {t.label} ({counts[t.key]})
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#166b40]" />}
              </button>
            ))}
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-[8px] border-b border-[#f0f0ec] px-[16px] py-[10px]">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-[9px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[#9aa0aa]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, description, product type or category..."
                className="h-[32px] w-full rounded-[5px] border border-[#e5e6e2] bg-white pl-[28px] pr-[9px] text-[12px] font-medium text-[#414b5e] outline-none placeholder:text-[#9aa0aa] focus:border-[#8fa98e]"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-[32px] min-w-[180px] rounded-[5px] border border-[#e5e6e2] bg-white px-2 text-[12px] font-medium text-[#414b5e] outline-none focus:border-[#8fa98e]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                  {c.isActive ? "" : " (hidden)"}
                </option>
              ))}
            </select>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e8e5df] bg-[#233D4D]">
                  <th className={`w-[44px] ${TH}`}>Order</th>
                  <th className={`w-[84px] ${TH}`}>Image</th>
                  <th className={TH}>Product</th>
                  <th className={TH}>Category</th>
                  <th className={`${TH} text-right`}>Price</th>
                  <th className={`${TH} text-center`}>Images</th>
                  <th className={`${TH} text-center`}>On website</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[12px] text-[#6c7587]">
                      Loading products…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[12px] font-semibold text-red-600">
                      {loadError}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[12px] text-[#6c7587]">
                      {products.length === 0 ? "No products yet." : "No products match your filters."}
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => {
                    const imageCount = [p.image, p.galleryImage1, p.galleryImage2].filter(Boolean).length;
                    const categoryHidden = p.category?.isActive === false;
                    return (
                      <tr
                        key={p._id}
                        onClick={() => router.push(`/products/${p._id}`)}
                        className={`cursor-pointer transition hover:bg-slate-50/80 ${p.isActive ? "" : "opacity-60"}`}
                      >
                        <td className="px-[10px] py-[8px] text-center text-[12px] font-semibold text-[#6c7587]">{p.order}</td>
                        <td className="px-[10px] py-[8px]">
                          <div className="h-[48px] w-[64px] overflow-hidden rounded-[5px] border border-[#e6dfd1]">
                            <ProductImage src={p.image} alt={p.imageAlt || p.title} className="h-full w-full object-cover" />
                          </div>
                        </td>
                        <td className="max-w-[320px] px-[10px] py-[8px]">
                          <p className="truncate text-[13px] font-bold text-[#18233b]">{p.title}</p>
                          <p className="truncate text-[11.5px] font-medium text-[#6c7587]" title={p.shortDescription}>
                            {p.shortDescription || "—"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-[10px] py-[8px] text-[12px] font-medium text-[#334155]">
                          {p.category?.name ?? "—"}
                          {categoryHidden && <span className="ml-1 text-[10.5px] font-bold text-amber-700">(hidden)</span>}
                        </td>
                        <td className="whitespace-nowrap px-[10px] py-[8px] text-right text-[12px]">
                          {p.price > 0 ? (
                            <>
                              <p className="font-bold text-[#18233b]">₹{p.price.toLocaleString("en-IN")}</p>
                              {p.mrp > p.price && (
                                <p className="text-[11px] text-[#6c7587]">
                                  <span className="line-through">₹{p.mrp.toLocaleString("en-IN")}</span>{" "}
                                  <span className="font-bold text-emerald-700">{Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off</span>
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="font-medium text-amber-700">On request</span>
                          )}
                        </td>
                        <td className="px-[10px] py-[8px] text-center text-[12px] font-semibold text-[#334155]">{imageCount} / 3</td>
                        <td className="px-[10px] py-[8px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center">
                            {busyId === p._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#6c7587]" />
                            ) : (
                              <Toggle checked={p.isActive} onChange={(v) => toggleVisible(p, v)} />
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-[10px] py-[8px]" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/products/${p._id}`}
                              title="Edit product"
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-sky-300/50 bg-sky-500/10 text-sky-700 transition hover:bg-sky-500/20"
                            >
                              <Pencil className="h-3 w-3" />
                            </Link>
                            <button
                              type="button"
                              title="Delete product"
                              disabled={busyId === p._id}
                              onClick={() => remove(p)}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-red-400/30 bg-red-500/10 text-red-600 transition hover:bg-red-500/20 disabled:opacity-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {rows.length > 0 && (
            <div className="border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[8px] text-[11.5px] font-semibold text-[#5f6a7c]">
              Showing {rows.length} of {products.length} products · Click a row to edit it
            </div>
          )}
        </div>
      </div>

      <ProductCategoriesModal
        isOpen={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        categories={categories}
        onChanged={load}
      />
    </div>
  );
}
