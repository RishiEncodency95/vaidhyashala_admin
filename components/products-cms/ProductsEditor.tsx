"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { cmsPages } from "@/lib/cmsPages";
import type { CmsRecord } from "@/lib/cmsJson";
import { pageContentApi, ContentPage } from "@/lib/pageContentApi";
import { productsApi, Product, ProductCategory, ProductInput } from "@/lib/productsApi";
import CmsPageEditorShell, { type ItemsEditorProps } from "@/components/cms-home/CmsPageEditorShell";
import { errorMessage, showError } from "@/components/cms-home/shared";
import { DRAFT_PREFIX, fromDraft, toDrafts } from "@/components/cms-content/ContentPageEditor";
import { ContentPageConfig } from "@/components/cms-content/pageConfigs";

/* Categories are listed inside "Category Filter & Search" and products inside
   "Product Catalogue", like the item lists of other pages, but they are saved
   through /api/cms/products rather than as part of the page text. */
const CATEGORY_SECTION = "categoryFilter";
const PRODUCT_SECTION = "catalog";

const categoryItem = (c: ProductCategory): CmsRecord => ({
  _id: c._id,
  name: c.name,
  slug: c.slug,
  order: c.order,
  isActive: c.isActive,
});

const productItem = (p: Product): CmsRecord => ({
  _id: p._id,
  image: p.image,
  galleryImage1: p.galleryImage1,
  galleryImage2: p.galleryImage2,
  title: p.title,
  slug: p.slug,
  category: p.category?._id ?? "",
  shortDescription: p.shortDescription,
  description: p.description,
  productType: p.productType,
  packOptions: p.packOptions,
  availability: p.availability,
  productInfo: p.productInfo,
  directions: p.directions,
  usageNotes: p.usageNotes,
  imageAlt: p.imageAlt,
  order: p.order,
  isActive: p.isActive,
});

const draftKey = (section: string) => `${DRAFT_PREFIX}${section}`;

function buildDrafts(config: ContentPageConfig, page: ContentPage, categories: ProductCategory[], products: Product[]) {
  return toDrafts(config, page.sections).map((draft) =>
    draft.key === draftKey(CATEGORY_SECTION)
      ? { ...draft, items: categories.map(categoryItem) }
      : draft.key === draftKey(PRODUCT_SECTION)
        ? { ...draft, items: products.map(productItem) }
        : draft,
  );
}

/** Page text of a draft section (the catalogue lists are not part of it) */
const sectionText = (draft: CmsRecord) => {
  const { key, data } = fromDraft(draft);
  if (key === CATEGORY_SECTION || key === PRODUCT_SECTION) delete data.items;
  return { key, data };
};

const itemsOf = (drafts: CmsRecord[], section: string): CmsRecord[] =>
  (drafts.find((d) => d.key === draftKey(section))?.items as CmsRecord[] | undefined) ?? [];

const str = (v: unknown) => String(v ?? "").trim();

/** Pages & CMS → Products: page texts plus the product catalogue, in the standard editor layout */
export default function ProductsEditor({ config }: { config: ContentPageConfig }) {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sectionsDraft, setSectionsDraft] = useState<CmsRecord[]>([]);
  // As last loaded, to work out what Save has to create / update / delete
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const cmsPage = cmsPages.find((p) => p.configKey === config.cmsConfigKey) ?? cmsPages[0];
  const sectionConfig = (draft: CmsRecord) => config.sections.find((s) => draftKey(s.key) === draft.key);

  const loadAll = useCallback(async () => {
    const [data, cats, prods] = await Promise.all([
      pageContentApi.getPage(config.pageKey),
      productsApi.listCategories(),
      productsApi.listProducts(),
    ]);
    setPage(data);
    setCategories(cats);
    setProducts(prods.items);
    setSectionsDraft(buildDrafts(config, data, cats, prods.items));
  }, [config]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadAll().catch((err) => setLoadError(errorMessage(err, "Could not load the Products page.")));
  }, [loadAll]);

  const categoryOptions = categories.map((c) => ({ label: c.isActive ? c.name : `${c.name} (hidden)`, value: c._id }));

  const resetToWebsiteDefaults = async () => {
    try {
      const defaults = await pageContentApi.getDefaults(config.pageKey);
      // Page texts go back to the website defaults; categories and products stay as they are
      setSectionsDraft((prev) =>
        toDrafts(config, defaults.sections).map((draft) => {
          const current = prev.find((d) => d.key === draft.key);
          return draft.key === draftKey(CATEGORY_SECTION) || draft.key === draftKey(PRODUCT_SECTION)
            ? { ...draft, items: current?.items ?? [] }
            : draft;
        }),
      );
      Swal.fire({
        title: "Reset to Website Content",
        text: "Page texts have been reset to the website content (products and categories are unchanged). Click Update Page to keep them.",
        icon: "success",
        timer: 2400,
        confirmButtonColor: "#0f766e",
      });
    } catch (err) {
      showError(errorMessage(err, "Could not load the website defaults."));
    }
  };

  const validate = () => {
    if (itemsOf(sectionsDraft, CATEGORY_SECTION).some((c) => !str(c.name))) return "Every category needs a name.";
    const productDrafts = itemsOf(sectionsDraft, PRODUCT_SECTION);
    if (productDrafts.some((p) => !str(p.title))) return "Every product needs a name.";
    if (productDrafts.some((p) => !p.category)) return "Every product needs a category (save a new category first).";
    for (const draft of sectionsDraft) {
      const sc = sectionConfig(draft);
      for (const [field, message] of sc?.required ?? []) {
        if (((draft.items ?? []) as CmsRecord[]).some((item) => !str(item[field]))) return `${sc!.name}: ${message}`;
      }
    }
    return null;
  };

  const saveContent = async () => {
    // 1. Page texts (only sections that changed)
    const original = buildDrafts(config, page!, categories, products);
    for (const [i, draft] of sectionsDraft.entries()) {
      const next = sectionText(draft);
      if (JSON.stringify(next.data) === JSON.stringify(sectionText(original[i]).data)) continue;
      await pageContentApi.updateSection(config.pageKey, next.key, next.data);
    }

    // 2. Categories added / edited (deletions wait until products have moved off them)
    const categoryDrafts = itemsOf(sectionsDraft, CATEGORY_SECTION);
    const originalCategories = new Map(categories.map((c) => [c._id, JSON.stringify(categoryItem(c))]));
    for (const [i, c] of categoryDrafts.entries()) {
      const payload = {
        name: str(c.name),
        order: Number(c.order) || i + 1,
        isActive: c.isActive !== false,
        ...(str(c.slug) ? { slug: str(c.slug).toLowerCase() } : {}),
      };
      if (!c._id) await productsApi.createCategory(payload);
      else if (originalCategories.get(String(c._id)) !== JSON.stringify(c)) await productsApi.updateCategory(String(c._id), payload);
    }

    // 3. Products added / edited / removed
    const productDrafts = itemsOf(sectionsDraft, PRODUCT_SECTION);
    const originalProducts = new Map(products.map((p) => [p._id, JSON.stringify(productItem(p))]));
    const keptIds = new Set<string>();
    for (const [i, p] of productDrafts.entries()) {
      const payload: ProductInput = {
        title: str(p.title),
        category: String(p.category),
        shortDescription: str(p.shortDescription),
        description: str(p.description),
        productType: str(p.productType),
        packOptions: str(p.packOptions),
        availability: str(p.availability),
        productInfo: str(p.productInfo),
        directions: str(p.directions),
        usageNotes: str(p.usageNotes),
        image: str(p.image),
        imageAlt: str(p.imageAlt),
        galleryImage1: str(p.galleryImage1),
        galleryImage2: str(p.galleryImage2),
        order: Number(p.order) || i + 1,
        isActive: p.isActive !== false,
        ...(str(p.slug) ? { slug: str(p.slug).toLowerCase() } : {}),
      };
      if (!p._id) {
        await productsApi.createProduct(payload);
        continue;
      }
      keptIds.add(String(p._id));
      if (originalProducts.get(String(p._id)) !== JSON.stringify(p)) await productsApi.updateProduct(String(p._id), payload);
    }
    for (const p of products) if (!keptIds.has(p._id)) await productsApi.deleteProduct(p._id);

    // 4. Categories removed
    const keptCategoryIds = new Set(categoryDrafts.map((c) => String(c._id ?? "")));
    for (const c of categories) if (!keptCategoryIds.has(c._id)) await productsApi.deleteCategory(c._id);
  };

  const blankItem = (section: CmsRecord): CmsRecord => {
    const count = ((section.items ?? []) as CmsRecord[]).length;
    if (section.key === draftKey(CATEGORY_SECTION)) return { name: "", slug: "", order: count + 1, isActive: true };
    if (section.key === draftKey(PRODUCT_SECTION)) {
      return {
        image: "",
        galleryImage1: "",
        galleryImage2: "",
        title: "",
        slug: "",
        category: categoryOptions[0]?.value ?? "",
        shortDescription: "",
        description: "",
        productType: "",
        packOptions: "Confirm with the clinic",
        availability: "Enquire with our team",
        productInfo: "",
        directions: "",
        usageNotes: "Use as directed by the product label or your treating doctor.",
        imageAlt: "",
        order: count + 1,
        isActive: true,
      };
    }
    return { ...(sectionConfig(section)?.blank ?? {}) };
  };

  const hero = (page?.sections.hero ?? {}) as Record<string, unknown>;

  return (
    <CmsPageEditorShell
      cmsPage={cmsPage}
      websitePath={page?.path ?? cmsPage.slug}
      seoPageKey={config.pageKey}
      meta={page}
      loadError={loadError}
      defaultH1={config.h1Fields.map((f) => hero[f]).filter(Boolean).join(" ")}
      defaultBreadcrumb={cmsPage.title}
      template={cmsPage.title}
      parent="Home"
      allowDraft
      sectionsDraft={sectionsDraft}
      setSectionsDraft={setSectionsDraft}
      blankItem={blankItem}
      getItemsEditorProps={(section): ItemsEditorProps => {
        const sc = sectionConfig(section);
        return {
          title: sc?.itemsTitle,
          addLabel: sc?.addLabel,
          // fieldOptions (even empty) also stops the item editor adding an "icon" field these lists don't have
          fieldOptions: section.key === draftKey(PRODUCT_SECTION) ? { category: categoryOptions } : {},
        };
      }}
      onResetSections={resetToWebsiteDefaults}
      validate={validate}
      saveContent={saveContent}
      saveSeo={(seo) => pageContentApi.updateSeo(config.pageKey, seo)}
      savePublish={(publish) => pageContentApi.updatePublish(config.pageKey, publish)}
      reload={loadAll}
    />
  );
}
