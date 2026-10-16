"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { cmsPages } from "@/lib/cmsPages";
import type { CmsRecord } from "@/lib/cmsJson";
import { home2Api, Home2Page, Home2SectionKey, Home2Sections } from "@/lib/home2Api";
import CmsPageEditorShell from "@/components/cms-home/CmsPageEditorShell";
import { errorMessage, showError } from "@/components/cms-home/shared";

/* Sections in website order, with the labels used for their item lists. Draft keys are
   prefixed so the shared section editor's special cases for other pages never apply. */
const SECTIONS: Array<{
  key: Home2SectionKey;
  name: string;
  itemsTitle?: string;
  addLabel?: string;
  blank?: CmsRecord;
  required?: Array<[field: string, message: string]>;
}> = [
  { key: "hero", name: "Hero" },
  {
    key: "highlights",
    name: "Highlights Strip",
    itemsTitle: "Highlights",
    addLabel: "Add Highlight",
    blank: { label: "" },
    required: [["label", "Every highlight needs its text."]],
  },
  {
    key: "carePillars",
    name: "Care at Vaidhyashala",
    itemsTitle: "Care Cards",
    addLabel: "Add Care Card",
    blank: { number: "", title: "", description: "", image: "", imageAlt: "", link: "" },
    required: [["title", "Every care card needs a title."]],
  },
  {
    key: "approach",
    name: "Our Approach",
    itemsTitle: "Approach Steps",
    addLabel: "Add Step",
    blank: { number: "", title: "", description: "" },
    required: [["title", "Every approach step needs a title."]],
  },
  {
    key: "concerns",
    name: "Explore Care by Concern",
    itemsTitle: "Health Concerns",
    addLabel: "Add Concern",
    blank: { label: "", iconImage: "", link: "/treatments" },
    required: [["label", "Every health concern needs a name."]],
  },
  { key: "products", name: "Authentic Products Banner" },
  {
    key: "appointment",
    name: "Appointment Booking",
    itemsTitle: "Services (dropdown options)",
    addLabel: "Add Service",
    blank: { label: "", value: "" },
    required: [
      ["label", "Every service needs a name."],
      ["value", "Every service needs a value (e.g. consultation)."],
    ],
  },
  {
    key: "faq",
    name: "FAQs",
    itemsTitle: "Questions & Answers",
    addLabel: "Add FAQ",
    blank: { question: "", answer: "" },
    required: [
      ["question", "Every FAQ needs a question."],
      ["answer", "Every FAQ needs an answer."],
    ],
  },
  { key: "cta", name: "Consultation CTA" },
];

const DRAFT_PREFIX = "home2-";
const sectionDef = (draft: CmsRecord) => SECTIONS.find((s) => `${DRAFT_PREFIX}${s.key}` === draft.key);

const home2CmsPage = cmsPages.find((p) => p.configKey === "home2Page") ?? cmsPages[0];

function toDrafts(sections: Home2Sections): CmsRecord[] {
  return SECTIONS.map(({ key, name }) => {
    const { isActive, ...fields } = (sections[key] ?? {}) as CmsRecord;
    return { key: `${DRAFT_PREFIX}${key}`, name, enabled: isActive !== false, ...fields };
  });
}

/** The section exactly as the backend expects it: text fields, isActive and the item list */
function fromDraft(draft: CmsRecord): { key: Home2SectionKey; data: CmsRecord } {
  const { key, enabled, ...rest } = draft;
  const fields: CmsRecord = { ...rest };
  delete fields.name;
  const data: CmsRecord = { isActive: enabled !== false };
  for (const [field, value] of Object.entries(fields)) {
    data[field] = Array.isArray(value)
      ? value.map((item: CmsRecord) =>
          Object.fromEntries(Object.entries(item).map(([k, v]) => [k, typeof v === "string" ? v.trim() : String(v ?? "")])),
        )
      : String(value ?? "");
  }
  return { key: String(key).slice(DRAFT_PREFIX.length) as Home2SectionKey, data };
}

/** Pages & CMS → Home 2: the website "/home" page, in the same layout as every other page editor */
export default function Home2Editor() {
  const [page, setPage] = useState<Home2Page | null>(null);
  const [loadError, setLoadError] = useState("");
  const [sectionsDraft, setSectionsDraft] = useState<CmsRecord[]>([]);

  const loadAll = useCallback(async () => {
    const data = await home2Api.getPage();
    setPage(data);
    setSectionsDraft(toDrafts(data.sections));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    loadAll().catch((err) => setLoadError(errorMessage(err, "Could not load Home 2.")));
  }, [loadAll]);

  const resetToWebsiteDefaults = async () => {
    try {
      const defaults = await home2Api.getDefaults();
      setSectionsDraft(toDrafts(defaults.sections));
      Swal.fire({
        title: "Reset to Website Content",
        text: "All sections and their lists have been reset to the live website content. Click Update Page to keep them.",
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
      const def = sectionDef(draft);
      const items = (draft.items ?? []) as CmsRecord[];
      for (const [field, message] of def?.required ?? []) {
        if (items.some((item) => !String(item[field] ?? "").trim())) return `${def!.name}: ${message}`;
      }
      if (def?.key === "appointment" && items.length === 0) return "Appointment Booking: add at least one service.";
    }
    return null;
  };

  const saveContent = async () => {
    const original = toDrafts(page!.sections);
    for (const [i, draft] of sectionsDraft.entries()) {
      const next = fromDraft(draft);
      if (JSON.stringify(next.data) === JSON.stringify(fromDraft(original[i]).data)) continue;
      await home2Api.updateSection(next.key, next.data);
    }
  };

  return (
    <CmsPageEditorShell
      cmsPage={home2CmsPage}
      websitePath="/home"
      seoPageKey="home2"
      meta={page}
      loadError={loadError}
      defaultH1={[page?.sections.hero?.titleLine1, page?.sections.hero?.titleLine2, page?.sections.hero?.titleHighlight]
        .filter(Boolean)
        .join(" ")}
      defaultBreadcrumb="Home"
      template="Home 2"
      sectionsDraft={sectionsDraft}
      setSectionsDraft={setSectionsDraft}
      blankItem={(section) => ({ ...(sectionDef(section)?.blank ?? {}) })}
      getItemsEditorProps={(section) => {
        const def = sectionDef(section);
        // fieldOptions (even empty) also stops the item editor adding an "icon" field these lists don't have
        return { title: def?.itemsTitle, addLabel: def?.addLabel, fieldOptions: {} };
      }}
      onResetSections={resetToWebsiteDefaults}
      validate={validate}
      saveContent={saveContent}
      saveSeo={home2Api.updateSeo}
      savePublish={home2Api.updatePublish}
      reload={loadAll}
    />
  );
}
