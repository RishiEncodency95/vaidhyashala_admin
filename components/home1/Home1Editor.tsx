"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { cmsPages } from "@/lib/cmsPages";
import type { CmsRecord } from "@/lib/cmsJson";
import { home1Api, Home1Article, Home1ArticleInput, Home1Category, Home1Page, Home1SectionKey, Home1Sections } from "@/lib/home1Api";
import CmsPageEditorShell from "@/components/cms-home/CmsPageEditorShell";
import { errorMessage, showError } from "@/components/cms-home/shared";

/* Home page sections, in website order. Draft keys are prefixed so the shared section
   editor's special cases for other pages (e.g. its "hero") never apply here. */
const SECTION_META: Array<{ key: Home1SectionKey; name: string }> = [
  { key: "hero", name: "Hero" },
  { key: "searchFilter", name: "Search & Category Filter" },
  { key: "featured", name: "Featured Article" },
  { key: "articlesSection", name: "Articles Grid" },
  { key: "cta", name: "Consultation CTA" },
];
const DRAFT_PREFIX = "home1-";
const NUMBER_FIELDS = new Set(["initialCount", "loadMoreStep"]);

const homePage = cmsPages.find((p) => p.configKey === "landingPage") ?? cmsPages[0];

/* Repeatable items shown inside the sections, like the item lists of the other pages:
   categories under Search & Category Filter, the featured article under Featured Article
   and every other article under Articles Grid. */
const categoryItem = (c: Home1Category): CmsRecord => ({
  _id: c._id,
  name: c.name,
  slug: c.slug,
  order: c.order,
  isActive: c.isActive,
});

const articleItem = (a: Home1Article): CmsRecord => ({
  _id: a._id,
  image: a.image,
  title: a.title,
  slug: a.slug,
  category: a.category?._id ?? "",
  excerpt: a.excerpt,
  imageAlt: a.imageAlt,
  link: a.link,
  order: a.order,
  isActive: a.isActive,
  isFeatured: a.isFeatured,
});

const ITEMS_BY_SECTION: Partial<Record<Home1SectionKey, (c: Home1Category[], a: Home1Article[]) => CmsRecord[]>> = {
  searchFilter: (categories) => categories.map(categoryItem),
  featured: (_, articles) =>
    articles.filter((a) => a.isFeatured).map((a) => {
      const item = articleItem(a);
      delete item.isFeatured; // always featured here
      return item;
    }),
  articlesSection: (_, articles) => articles.filter((a) => !a.isFeatured).map(articleItem),
};

function toDrafts(sections: Home1Sections, categories: Home1Category[], articles: Home1Article[]): CmsRecord[] {
  return SECTION_META.map(({ key, name }) => {
    const { isActive, ...fields } = (sections[key] ?? {}) as unknown as CmsRecord;
    const items = ITEMS_BY_SECTION[key]?.(categories, articles);
    return { key: `${DRAFT_PREFIX}${key}`, name, enabled: isActive !== false, ...fields, ...(items ? { items } : {}) };
  });
}

/** Section content only: the items are saved through their own APIs */
function fromDraft(draft: CmsRecord): { key: Home1SectionKey; data: Record<string, unknown> } {
  const { key, enabled, ...rest } = draft;
  const fields: CmsRecord = { ...rest };
  delete fields.name;
  delete fields.items;
  const data: Record<string, unknown> = { isActive: enabled !== false };
  for (const [field, value] of Object.entries(fields)) {
    data[field] = NUMBER_FIELDS.has(field) ? Math.max(1, Number(value) || 1) : String(value ?? "");
  }
  return { key: String(key).slice(DRAFT_PREFIX.length) as Home1SectionKey, data };
}

const sectionContent = (draft: CmsRecord) => JSON.stringify(fromDraft(draft).data);
const draftItems = (drafts: CmsRecord[], key: Home1SectionKey): CmsRecord[] =>
  (drafts.find((d) => d.key === `${DRAFT_PREFIX}${key}`)?.items as CmsRecord[] | undefined) ?? [];

/** Pages & CMS → Home: the website home page ("/"), in the same layout as every other page editor */
export default function Home1Editor() {
  const [page, setPage] = useState<Home1Page | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sectionsDraft, setSectionsDraft] = useState<CmsRecord[]>([]);
  // As last loaded from the server, to work out what Save has to create / update / delete
  const [categories, setCategories] = useState<Home1Category[]>([]);
  const [articles, setArticles] = useState<Home1Article[]>([]);

  const loadAll = useCallback(async () => {
    const [data, cats, arts] = await Promise.all([
      home1Api.getPage(),
      home1Api.listCategories(),
      home1Api.listArticles(),
    ]);
    setPage(data);
    setCategories(cats);
    setArticles(arts.items);
    setSectionsDraft(toDrafts(data.sections, cats, arts.items));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadAll().catch((err) => setLoadError(errorMessage(err, "Could not load the home page.")));
  }, [loadAll]);

  const categoryOptions = categories.map((c) => ({ label: c.isActive ? c.name : `${c.name} (hidden)`, value: c._id }));

  const resetToWebsiteDefaults = async () => {
    try {
      const defaults = await home1Api.getDefaults();
      // Section text goes back to the website defaults; categories and articles stay as they are
      setSectionsDraft((prev) =>
        toDrafts(defaults.sections, categories, articles).map((draft, i) =>
          prev[i]?.items ? { ...draft, items: prev[i].items } : draft,
        ),
      );
      Swal.fire({
        title: "Reset to Website Content",
        text: "Page sections have been reset to the live website defaults. Click Update Page to keep them.",
        icon: "success",
        timer: 2200,
        confirmButtonColor: "#0f766e",
      });
    } catch (err) {
      showError(errorMessage(err, "Could not load the website defaults."));
    }
  };

  const validate = () => {
    const categoryDrafts = draftItems(sectionsDraft, "searchFilter");
    const featuredDrafts = draftItems(sectionsDraft, "featured");
    const gridDrafts = draftItems(sectionsDraft, "articlesSection");

    const missing =
      categoryDrafts.find((c) => !String(c.name ?? "").trim()) ? "Every category needs a name." :
      [...featuredDrafts, ...gridDrafts].find((a) => !String(a.title ?? "").trim()) ? "Every article needs a title." :
      [...featuredDrafts, ...gridDrafts].find((a) => !a.category) ? "Every article needs a category." : "";
    return missing || null;
  };

  const saveContent = async () => {
    const categoryDrafts = draftItems(sectionsDraft, "searchFilter");
    const featuredDrafts = draftItems(sectionsDraft, "featured");
    const gridDrafts = draftItems(sectionsDraft, "articlesSection");

    // 1. Section content (only sections whose own fields changed)
    const original = toDrafts(page!.sections, categories, articles);
    for (const [i, draft] of sectionsDraft.entries()) {
      if (sectionContent(draft) === sectionContent(original[i])) continue;
      const { key, data } = fromDraft(draft);
      await home1Api.updateSection(key, data);
    }

    // 2. Categories added / edited (deletions wait until articles have moved off them)
    const originalCategories = new Map(categories.map((c) => [c._id, JSON.stringify(categoryItem(c))]));
    for (const [i, c] of categoryDrafts.entries()) {
      const payload = {
        name: String(c.name).trim(),
        order: Number(c.order) || i + 1,
        isActive: c.isActive !== false,
        ...(String(c.slug ?? "").trim() ? { slug: String(c.slug).trim().toLowerCase() } : {}),
      };
      if (!c._id) await home1Api.createCategory(payload);
      else if (originalCategories.get(String(c._id)) !== JSON.stringify(c)) await home1Api.updateCategory(String(c._id), payload);
    }

    // 3. Articles: Featured Article items are featured, Articles Grid items are not
    //    (unless switched to featured there). Grid is saved last so its choice wins.
    const originalArticles = new Map(articles.map((a) => [a._id, JSON.stringify(articleItem(a))]));
    const keptIds = new Set<string>();
    const saveArticle = async (a: CmsRecord, featured: boolean, i: number) => {
      const payload: Home1ArticleInput = {
        title: String(a.title).trim(),
        excerpt: String(a.excerpt ?? "").trim(),
        category: String(a.category),
        image: String(a.image ?? "").trim(),
        imageAlt: String(a.imageAlt ?? "").trim(),
        link: String(a.link ?? "").trim(),
        order: Number(a.order) || i + 1,
        isActive: a.isActive !== false,
        isFeatured: featured,
        ...(String(a.slug ?? "").trim() ? { slug: String(a.slug).trim().toLowerCase() } : {}),
      };
      if (!a._id) return home1Api.createArticle(payload);
      keptIds.add(String(a._id));
      const unchanged = originalArticles.get(String(a._id)) === JSON.stringify(articleItem({ ...(a as Home1Article), category: { _id: String(a.category) } as Home1Article["category"], isFeatured: featured }));
      if (!unchanged) await home1Api.updateArticle(String(a._id), payload);
    };
    for (const [i, a] of featuredDrafts.entries()) await saveArticle(a, true, i);
    for (const [i, a] of gridDrafts.entries()) await saveArticle(a, a.isFeatured === true, i);

    // Removed from Featured Article only = no longer featured (it moves to the grid);
    // removed from Articles Grid = deleted
    for (const a of articles) {
      if (keptIds.has(a._id)) continue;
      if (a.isFeatured) await home1Api.updateArticle(a._id, { isFeatured: false });
      else await home1Api.deleteArticle(a._id);
    }

    // 4. Categories removed
    const keptCategoryIds = new Set(categoryDrafts.map((c) => String(c._id ?? "")));
    for (const c of categories) {
      if (!keptCategoryIds.has(c._id)) await home1Api.deleteCategory(c._id);
    }
  };

  const blankItem = (section: CmsRecord): CmsRecord =>
    section.key === `${DRAFT_PREFIX}searchFilter`
      ? { name: "", slug: "", order: (section.items ?? []).length + 1, isActive: true }
      : {
          image: "",
          title: "",
          slug: "",
          category: categoryOptions[0]?.value ?? "",
          excerpt: "",
          imageAlt: "",
          link: "",
          order: (section.items ?? []).length + 1,
          isActive: true,
          ...(section.key === `${DRAFT_PREFIX}articlesSection` ? { isFeatured: false } : {}),
        };

  return (
    <CmsPageEditorShell
      cmsPage={homePage}
      websitePath="/"
      seoPageKey="home"
      meta={page}
      loadError={loadError}
      defaultH1={[page?.sections.hero?.titleLine1, page?.sections.hero?.titleLine2].filter(Boolean).join(" ")}
      defaultBreadcrumb={page?.sections.hero?.breadcrumbCurrentLabel ?? ""}
      sectionsDraft={sectionsDraft}
      setSectionsDraft={setSectionsDraft}
      blankItem={blankItem}
      getItemsEditorProps={(section) => {
        if (section.key === `${DRAFT_PREFIX}searchFilter`) {
          return { title: "Categories (filter pills)", addLabel: "Add Category" };
        }
        if (section.key === `${DRAFT_PREFIX}featured`) {
          return {
            title: "Featured Article",
            addLabel: "Add Featured Article",
            canAdd: (section.items ?? []).length === 0,
            fieldOptions: { category: categoryOptions },
          };
        }
        if (section.key === `${DRAFT_PREFIX}articlesSection`) {
          return { title: "Article Cards", addLabel: "Add Article", fieldOptions: { category: categoryOptions } };
        }
        return {};
      }}
      onResetSections={resetToWebsiteDefaults}
      validate={validate}
      saveContent={saveContent}
      saveSeo={home1Api.updateSeo}
      savePublish={home1Api.updatePublish}
      reload={loadAll}
    />
  );
}
