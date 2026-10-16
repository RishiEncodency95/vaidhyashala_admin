"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { cmsPages } from "@/lib/cmsPages";
import type { CmsRecord } from "@/lib/cmsJson";
import { pageContentApi, ContentPage, ContentSection } from "@/lib/pageContentApi";
import CmsPageEditorShell from "@/components/cms-home/CmsPageEditorShell";
import { errorMessage, showError } from "@/components/cms-home/shared";
import { ContentPageConfig } from "./pageConfigs";

/* Draft keys are prefixed so the shared section editor's special cases for other pages
   (e.g. its "hero" or "footer") never apply to these sections. */
export const DRAFT_PREFIX = "content-";

export function toDrafts(config: ContentPageConfig, sections: Record<string, ContentSection>): CmsRecord[] {
  return config.sections.map(({ key, name }) => {
    const { isActive, ...fields } = (sections[key] ?? {}) as CmsRecord;
    return { key: `${DRAFT_PREFIX}${key}`, name, enabled: isActive !== false, ...fields };
  });
}

/** The section exactly as the backend expects it: text fields, isActive and the item list */
export function fromDraft(draft: CmsRecord): { key: string; data: CmsRecord } {
  const { key, enabled, ...rest } = draft;
  const fields: CmsRecord = { ...rest };
  delete fields.name;
  const data: CmsRecord = { isActive: enabled !== false };
  for (const [field, value] of Object.entries(fields)) {
    data[field] = Array.isArray(value)
      ? value.map((item: CmsRecord) =>
          Object.fromEntries(
            Object.entries(item).map(([k, v]) => [k, typeof v === "string" ? v.trim() : typeof v === "boolean" ? v : String(v ?? "")]),
          ),
        )
      : typeof value === "string"
        ? value
        : String(value ?? "");
  }
  return { key: String(key).slice(DRAFT_PREFIX.length), data };
}

/** Pages & CMS editor for a page backed by /api/cms/pages/:pageKey, in the standard editor layout */
export default function ContentPageEditor({ config }: { config: ContentPageConfig }) {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sectionsDraft, setSectionsDraft] = useState<CmsRecord[]>([]);

  const cmsPage = cmsPages.find((p) => p.configKey === config.cmsConfigKey) ?? cmsPages[0];
  const sectionConfig = (draft: CmsRecord) =>
    config.sections.find((s) => `${DRAFT_PREFIX}${s.key}` === draft.key);

  const loadAll = useCallback(async () => {
    const data = await pageContentApi.getPage(config.pageKey);
    setPage(data);
    setSectionsDraft(toDrafts(config, data.sections));
  }, [config]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadAll().catch((err) => setLoadError(errorMessage(err, `Could not load ${cmsPage.title}.`)));
  }, [loadAll, cmsPage.title]);

  const resetToWebsiteDefaults = async () => {
    try {
      const defaults = await pageContentApi.getDefaults(config.pageKey);
      setSectionsDraft(toDrafts(config, defaults.sections));
      Swal.fire({
        title: "Reset to Website Content",
        text: "All sections and their lists have been reset to the website content. Click Update Page to keep them.",
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
      const items = (draft.items ?? []) as CmsRecord[];
      for (const [field, message] of sc?.required ?? []) {
        if (items.some((item) => !String(item[field] ?? "").trim())) return `${sc!.name}: ${message}`;
      }
    }
    return null;
  };

  const saveContent = async () => {
    const original = toDrafts(config, page!.sections);
    for (const [i, draft] of sectionsDraft.entries()) {
      const next = fromDraft(draft);
      if (JSON.stringify(next.data) === JSON.stringify(fromDraft(original[i]).data)) continue;
      await pageContentApi.updateSection(config.pageKey, next.key, next.data);
    }
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
      blankItem={(section) => ({ ...(sectionConfig(section)?.blank ?? {}) })}
      getItemsEditorProps={(section) => {
        const sc = sectionConfig(section);
        // fieldOptions (even empty) also stops the item editor adding an "icon" field these lists don't have
        return { title: sc?.itemsTitle, addLabel: sc?.addLabel, fieldOptions: {} };
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
