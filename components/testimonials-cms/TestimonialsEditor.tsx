"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { cmsPages } from "@/lib/cmsPages";
import type { CmsRecord } from "@/lib/cmsJson";
import { pageContentApi, ContentPage } from "@/lib/pageContentApi";
import { testimonialsApi, Testimonial, TestimonialInput } from "@/lib/testimonialsApi";
import CmsPageEditorShell, { type ItemsEditorProps } from "@/components/cms-home/CmsPageEditorShell";
import { errorMessage, showError } from "@/components/cms-home/shared";
import { DRAFT_PREFIX, fromDraft, toDrafts } from "@/components/cms-content/ContentPageEditor";
import { ContentPageConfig } from "@/components/cms-content/pageConfigs";

/* The filter categories are page text (Category Filter section). The cards are listed inside
   "Testimonial Cards" like any item list, but are saved through /api/cms/testimonials. */
const CATEGORY_SECTION = "categoryFilter";
const CARD_SECTION = "grid";

const cardItem = (t: Testimonial): CmsRecord => ({
  _id: t._id,
  photo: t.photo,
  name: t.name,
  category: t.category,
  quote: t.quote,
  order: t.order,
  isSample: t.isSample,
  isFeatured: t.isFeatured,
  isActive: t.isActive,
});

const draftKey = (section: string) => `${DRAFT_PREFIX}${section}`;
const str = (v: unknown) => String(v ?? "").trim();

function buildDrafts(config: ContentPageConfig, page: ContentPage, cards: Testimonial[]) {
  return toDrafts(config, page.sections).map((draft) =>
    draft.key === draftKey(CARD_SECTION) ? { ...draft, items: cards.map(cardItem) } : draft,
  );
}

/** Page text of a draft section (the cards are not part of it) */
const sectionText = (draft: CmsRecord) => {
  const { key, data } = fromDraft(draft);
  if (key === CARD_SECTION) delete data.items;
  return { key, data };
};

const itemsOf = (drafts: CmsRecord[], section: string): CmsRecord[] =>
  (drafts.find((d) => d.key === draftKey(section))?.items as CmsRecord[] | undefined) ?? [];

/** Pages & CMS → Patient Testimonials: page texts plus the testimonial cards */
export default function TestimonialsEditor({ config }: { config: ContentPageConfig }) {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sectionsDraft, setSectionsDraft] = useState<CmsRecord[]>([]);
  // As last loaded, to work out what Save has to create / update / delete
  const [cards, setCards] = useState<Testimonial[]>([]);

  const cmsPage = cmsPages.find((p) => p.configKey === config.cmsConfigKey) ?? cmsPages[0];
  const sectionConfig = (draft: CmsRecord) => config.sections.find((s) => draftKey(s.key) === draft.key);

  const loadAll = useCallback(async () => {
    const [data, list] = await Promise.all([pageContentApi.getPage(config.pageKey), testimonialsApi.list()]);
    setPage(data);
    setCards(list.items);
    setSectionsDraft(buildDrafts(config, data, list.items));
  }, [config]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadAll().catch((err) => setLoadError(errorMessage(err, "Could not load the Patient Testimonials page.")));
  }, [loadAll]);

  // Categories as currently edited, so a new category can be picked straight away
  const categoryOptions = itemsOf(sectionsDraft, CATEGORY_SECTION)
    .filter((c) => str(c.value))
    .map((c) => ({ label: str(c.label) || str(c.value), value: str(c.value) }));

  const resetToWebsiteDefaults = async () => {
    try {
      const defaults = await pageContentApi.getDefaults(config.pageKey);
      setSectionsDraft((prev) =>
        toDrafts(config, defaults.sections).map((draft) =>
          draft.key === draftKey(CARD_SECTION) ? { ...draft, items: prev.find((d) => d.key === draft.key)?.items ?? [] } : draft,
        ),
      );
      Swal.fire({
        title: "Reset to Website Content",
        text: "Page texts have been reset to the website content (testimonial cards are unchanged). Click Update Page to keep them.",
        icon: "success",
        timer: 2400,
        confirmButtonColor: "#0f766e",
      });
    } catch (err) {
      showError(errorMessage(err, "Could not load the website defaults."));
    }
  };

  const validate = () => {
    for (const draft of sectionsDraft) {
      const sc = sectionConfig(draft);
      for (const [field, message] of sc?.required ?? []) {
        if (((draft.items ?? []) as CmsRecord[]).some((item) => !str(item[field]))) return `${sc!.name}: ${message}`;
      }
    }
    const categories = new Set(categoryOptions.map((c) => c.value));
    for (const card of itemsOf(sectionsDraft, CARD_SECTION)) {
      if (!str(card.name) || !str(card.quote)) return "Every testimonial needs a name and a quote.";
      if (!categories.has(str(card.category))) {
        return `"${str(card.name) || "A testimonial"}" uses a category that is no longer in the Category Filter.`;
      }
    }
    return null;
  };

  const saveContent = async () => {
    // 1. Page texts first, so new categories exist before cards use them
    const original = buildDrafts(config, page!, cards);
    for (const [i, draft] of sectionsDraft.entries()) {
      const next = sectionText(draft);
      if (JSON.stringify(next.data) === JSON.stringify(sectionText(original[i]).data)) continue;
      await pageContentApi.updateSection(config.pageKey, next.key, next.data);
    }

    // 2. Cards added / edited / removed
    const originalCards = new Map(cards.map((t) => [t._id, JSON.stringify(cardItem(t))]));
    const keptIds = new Set<string>();
    for (const [i, c] of itemsOf(sectionsDraft, CARD_SECTION).entries()) {
      const payload: TestimonialInput = {
        name: str(c.name),
        category: str(c.category),
        quote: str(c.quote),
        photo: str(c.photo),
        order: Number(c.order) || i + 1,
        isSample: c.isSample === true,
        isFeatured: c.isFeatured === true,
        isActive: c.isActive !== false,
      };
      if (!c._id) {
        await testimonialsApi.create(payload);
        continue;
      }
      keptIds.add(String(c._id));
      if (originalCards.get(String(c._id)) !== JSON.stringify(c)) await testimonialsApi.update(String(c._id), payload);
    }
    for (const t of cards) if (!keptIds.has(t._id)) await testimonialsApi.remove(t._id);
  };

  const blankItem = (section: CmsRecord): CmsRecord => {
    const count = ((section.items ?? []) as CmsRecord[]).length;
    if (section.key === draftKey(CARD_SECTION)) {
      return {
        photo: "",
        name: "",
        category: categoryOptions[0]?.value ?? "",
        quote: "",
        order: count + 1,
        isSample: false,
        isFeatured: false,
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
          fieldOptions: section.key === draftKey(CARD_SECTION) ? { category: categoryOptions } : {},
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
