"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { uploadApi } from "@/lib/uploadApi";
import { cmsPages, getCmsPageRouteKey, PUBLIC_SITE_URL, type CmsPage } from "@/lib/cmsPages";
import type { CmsJson, CmsRecord } from "@/lib/cmsJson";
import { useAppSelector } from "@/store/hooks";
import {
  BasicInfoPanel,
  EditPageHeader,
  PageSectionsPanel,
  PageSettingsPanel,
  PublishPanel,
  QuickActionsPanel,
  SeoScorePanel,
  SeoSettingsPanel,
} from "@/components/pages-cms/panels";
import { getPageForTemplate } from "@/components/pages-cms/utils/templateMapping";
import type { FormState } from "@/components/pages-cms/types";
import typography from "@/app/(dashboard)/pages/PagesTypography.module.css";
import { errorMessage } from "./shared";
import { parseSchemaMarkup } from "@/lib/schemaMarkup";

/** SEO + Publish data every CMS-managed page (Home 1, Home 2) stores on the backend */
export interface CmsPageMeta {
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    canonicalTag: string;
    openGraphTags: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    h1Tag: string;
    breadcrumbName: string;
    schemaMarkup: string;
    robotsIndex: boolean;
    robotsFollow: boolean;
  };
  publish: {
    status: "Published" | "Draft";
    visibility: "Public" | "Private";
    publishedAt: string;
    author: string;
    showInNavigation: boolean;
    menuOrder: number;
  };
  updatedAt: string;
}

export type ItemsEditorProps = {
  fieldOptions?: Record<string, Array<{ label: string; value: string }>>;
  title?: string;
  addLabel?: string;
  canAdd?: boolean;
};

interface ShellProps {
  /** The Pages & CMS row being edited (title, slug, template) */
  cmsPage: CmsPage;
  /** Website path for Preview / View Page */
  websitePath: string;
  /** Page key sent to the SEO auto-generator */
  seoPageKey: string;
  meta: CmsPageMeta | null;
  loadError: string;
  defaultH1: string;
  defaultBreadcrumb: string;

  sectionsDraft: CmsRecord[];
  setSectionsDraft: React.Dispatch<React.SetStateAction<CmsRecord[]>>;
  /** A blank item for "Add …" in a section's item list */
  blankItem: (section: CmsRecord) => CmsRecord;
  getItemsEditorProps?: (section: CmsRecord) => ItemsEditorProps;
  onResetSections: () => Promise<void>;

  /** Message to block the save with, or null */
  validate?: () => string | null;
  /** Saves the page's own content (sections, items) */
  saveContent: () => Promise<void>;
  saveSeo: (seo: CmsPageMeta["seo"]) => Promise<unknown>;
  savePublish: (publish: Partial<CmsPageMeta["publish"]>) => Promise<unknown>;
  /** Reloads everything from the server after a save */
  reload: () => Promise<void>;
  /** Home pages must stay published; other pages may be saved as Draft */
  allowDraft?: boolean;
  /** Basic Information → Template / Page Parent (default: a top-level Homepage) */
  template?: string;
  parent?: string;
}

function formFromMeta(props: ShellProps, meta: CmsPageMeta, adminName?: string): FormState {
  const { seo, publish } = meta;
  const slug = props.cmsPage.slug === "/" ? "" : props.cmsPage.slug.replace(/^\//, "");
  return {
    pageTitle: props.cmsPage.title,
    slug,
    template: props.template ?? "Homepage",
    parent: props.parent ?? "— No Parent (Top Level) —",
    metaTitle: seo.metaTitle ?? "",
    metaDescription: seo.metaDescription ?? "",
    metaKeywords: seo.metaKeywords ?? "",
    canonicalUrl: seo.canonicalUrl ?? "",
    canonicalTag: seo.canonicalTag || (seo.canonicalUrl ? `<link rel="canonical" href="${seo.canonicalUrl}" />` : ""),
    openGraphTags: seo.openGraphTags ?? "",
    ogTitle: seo.ogTitle ?? "",
    ogDescription: seo.ogDescription ?? "",
    ogImage: seo.ogImage ?? "",
    h1Tag: seo.h1Tag || props.defaultH1,
    breadcrumbName: seo.breadcrumbName || props.defaultBreadcrumb,
    schemaMarkup: seo.schemaMarkup ?? "",
    robotsIndex: seo.robotsIndex !== false,
    robotsFollow: seo.robotsFollow !== false,
    isActive: true,
    status: publish?.status ?? "Published",
    visibility: publish?.visibility ?? "Public",
    author: publish?.author || adminName || "Admin User",
    publishedAt: publish?.publishedAt || meta.updatedAt,
    lastUpdated: meta.updatedAt,
    updatedBy: adminName || "Admin User",
    showInNavigation: publish?.showInNavigation !== false,
    menuOrder: String(publish?.menuOrder ?? 1),
  };
}

/**
 * The Pages & CMS editor layout (header, Basic Info, Page Sections, SEO, Page Settings,
 * Publish, SEO Score, Quick Actions) for pages whose content lives in their own backend
 * module. Remounted (via key) after every save so the form shows what was stored.
 */
function EditorBody(props: ShellProps & { meta: CmsPageMeta }) {
  const { cmsPage, websitePath, meta, sectionsDraft, setSectionsDraft } = props;
  const router = useRouter();
  const currentAdmin = useAppSelector((state) => state.auth.admin);

  const [form, setForm] = useState<FormState>(() => formFromMeta(props, meta, currentAdmin?.name));
  const [openSectionIndices, setOpenSectionIndices] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [isEditingPublishDate, setIsEditingPublishDate] = useState(false);
  const [ogUploading, setOgUploading] = useState(false);
  const [ogPreview, setOgPreview] = useState<string | null>(null);
  const canonicalEditorRef = useRef<HTMLDivElement | null>(null);

  // Keep the canonical tag editor (a contentEditable div) in step with the form
  useEffect(() => {
    const el = canonicalEditorRef.current;
    if (!el) return;
    const target = (form.canonicalTag || form.canonicalUrl || "").trim();
    if (target && el.innerText.trim() !== target && !el.contains(document.activeElement)) el.innerText = target;
  }, [form.canonicalTag, form.canonicalUrl]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const syncCanonicalFromEditor = () => {
    const val = (canonicalEditorRef.current?.innerText || "").trim();
    updateField("canonicalTag", val);
    const match = val.match(/href=["']([^"']+)["']/i);
    updateField("canonicalUrl", match ? match[1] : val.replace(/<[^>]*>/g, "").trim());
  };

  const execCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value ?? undefined);
    canonicalEditorRef.current?.focus();
    syncCanonicalFromEditor();
  };

  const handleCanonicalPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
    syncCanonicalFromEditor();
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOgPreview(URL.createObjectURL(file));
    setOgUploading(true);
    try {
      const res = await uploadApi.file(file, "vaidhyashala/seo");
      if (res?.url) updateField("ogImage", res.url);
    } catch (err) {
      Swal.fire({ title: "Upload Failed", text: errorMessage(err, "Could not upload the image."), icon: "error" });
    } finally {
      setOgUploading(false);
    }
  };

  const autoGenerateSeo = async (envType: "local" | "live") => {
    try {
      const res: CmsJson = await api.post("/seo/generate", {
        page: props.seoPageKey,
        // The page's own website address, for the canonical URL, og:url and schema
        path: websitePath,
        envType,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        ogImage: form.ogImage || undefined,
      });
      const gen = res?.data?.data || res?.data || res;
      if (!gen) return;
      updateField("canonicalUrl", gen.canonicalUrl || "");
      updateField("canonicalTag", gen.canonicalTag || "");
      updateField("openGraphTags", gen.openGraphTags || "");
      updateField("schemaMarkup", gen.schemaMarkup || "");
      if (!form.metaTitle && gen.metaTitle) updateField("metaTitle", gen.metaTitle);
      if (!form.metaDescription && gen.metaDescription) updateField("metaDescription", gen.metaDescription);
      if (!form.metaKeywords && gen.metaKeywords) updateField("metaKeywords", gen.metaKeywords);
      if (!form.ogImage && gen.ogImage) updateField("ogImage", gen.ogImage);
      if (canonicalEditorRef.current) canonicalEditorRef.current.innerText = gen.canonicalTag || gen.canonicalUrl || "";
      Swal.fire({ title: `Auto-Generated for ${envType.toUpperCase()}`, icon: "success", timer: 2000 });
    } catch (err) {
      Swal.fire({ title: "Generation Failed", text: errorMessage(err, "Failed to auto-generate SEO tags"), icon: "error" });
    }
  };

  const handleTemplateChange = (value: string) => {
    if (value === (props.template ?? "Homepage")) return updateField("template", value);
    const target = getPageForTemplate(value, cmsPages);
    if (target) router.push(`/pages/${getCmsPageRouteKey(target)}/edit`);
  };

  const openWebsite = () => window.open(`${PUBLIC_SITE_URL}${websitePath}`, "_blank", "noopener,noreferrer");

  const savePage = async () => {
    if (form.status === "Draft" && !props.allowDraft) {
      return Swal.fire({ title: "Not allowed", text: "A home page cannot be unpublished.", icon: "warning" });
    }
    // Plain JSON-LD, or JSON-LD inside <script type="application/ld+json"> / <script type="application/json">
    if (parseSchemaMarkup(form.schemaMarkup) === null) {
      return Swal.fire({
        title: "Invalid schema",
        text: "Schema markup must be valid JSON-LD: plain JSON, or JSON inside a <script> tag.",
        icon: "error",
      });
    }
    const problem = props.validate?.();
    if (problem) return Swal.fire({ title: "Missing details", text: problem, icon: "warning" });

    setSaving(true);
    try {
      await props.saveContent();
      await props.saveSeo({
        metaTitle: form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
        metaKeywords: form.metaKeywords.trim(),
        canonicalUrl: form.canonicalUrl.trim(),
        canonicalTag: form.canonicalTag.trim(),
        openGraphTags: form.openGraphTags,
        ogTitle: form.ogTitle.trim(),
        ogDescription: form.ogDescription.trim(),
        ogImage: form.ogImage.trim(),
        h1Tag: form.h1Tag.trim(),
        breadcrumbName: form.breadcrumbName.trim(),
        schemaMarkup: form.schemaMarkup,
        robotsIndex: form.robotsIndex,
        robotsFollow: form.robotsFollow,
      });
      await props.savePublish({
        status: props.allowDraft ? form.status : "Published",
        visibility: form.visibility,
        publishedAt: form.publishedAt,
        author: form.author,
        showInNavigation: form.showInNavigation,
        menuOrder: Number(form.menuOrder) || 0,
      });
      await props.reload();
      Swal.fire({
        title: "Page Updated",
        text: `Changes to "${form.pageTitle}" have been saved successfully.`,
        icon: "success",
        confirmButtonColor: "#218DAE",
        timer: 2000,
      });
    } catch (err) {
      // Part of the save may have gone through: show what is stored now
      await props.reload().catch(() => undefined);
      Swal.fire({ title: "Save Failed", text: errorMessage(err, "Could not save this page."), icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateItems = (sectionIndex: number, change: (items: CmsRecord[], section: CmsRecord) => CmsRecord[]) =>
    setSectionsDraft((prev) =>
      prev.map((s, i) => (i === sectionIndex ? { ...s, items: change([...(s.items ?? [])], s) } : s)),
    );

  return (
    <div className={`${typography.pages} min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]`}>
      <div className="flex flex-col px-[18px] pb-[16px] pt-[14px]">
        <EditPageHeader
          onBack={() => router.push("/pages")}
          onPreview={openWebsite}
          onSyncReset={props.onResetSections}
          onSave={savePage}
          saving={saving}
        />

        <div className="grid grid-cols-[minmax(0,2.35fr)_minmax(330px,1fr)] items-start gap-[10px]">
          <div className="flex flex-col gap-[8px]">
            <BasicInfoPanel form={form} updateField={updateField} pages={cmsPages} onTemplateChange={handleTemplateChange} />

            <PageSectionsPanel
              sectionsDraft={sectionsDraft}
              setSectionsDraft={setSectionsDraft}
              openSectionIndices={openSectionIndices}
              setOpenSectionIndices={setOpenSectionIndices}
              toggleSectionAccordion={(index) =>
                setOpenSectionIndices((prev) => {
                  const next = new Set(prev);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                })
              }
              updateSectionField={(sectionIndex, key, value) =>
                setSectionsDraft((prev) => prev.map((s, i) => (i === sectionIndex ? { ...s, [key]: value } : s)))
              }
              updateSectionItem={(sectionIndex, itemIndex, key, value) =>
                updateItems(sectionIndex, (items) => {
                  items[itemIndex] = { ...items[itemIndex], [key]: value };
                  return items;
                })
              }
              addSectionItem={(sectionIndex) =>
                updateItems(sectionIndex, (items, section) => [...items, props.blankItem(section)])
              }
              removeSectionItem={(sectionIndex, itemIndex) =>
                updateItems(sectionIndex, (items) => items.filter((_, j) => j !== itemIndex))
              }
              resetToWebsiteDefaults={props.onResetSections}
              getItemsEditorProps={props.getItemsEditorProps}
            />

            <SeoSettingsPanel
              form={form}
              updateField={updateField}
              page={cmsPage}
              canonicalEditorRef={canonicalEditorRef}
              execCommand={execCommand}
              onCanonicalInput={syncCanonicalFromEditor}
              onCanonicalPaste={handleCanonicalPaste}
              ogUploading={ogUploading}
              ogPreview={ogPreview}
              onOgImageUpload={handleOgImageUpload}
              onRemoveOgImage={() => {
                updateField("ogImage", "");
                setOgPreview(null);
              }}
              onAutoGenerateSeo={autoGenerateSeo}
            />

            <PageSettingsPanel form={form} updateField={updateField} />
          </div>

          <div className="flex flex-col gap-[8px]">
            <PublishPanel
              form={form}
              updateField={updateField}
              isEditingPublishDate={isEditingPublishDate}
              setIsEditingPublishDate={setIsEditingPublishDate}
              currentAdminName={currentAdmin?.name}
            />
            <SeoScorePanel />
            <QuickActionsPanel form={form} onViewPage={openWebsite} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CmsPageEditorShell(props: ShellProps) {
  if (props.loadError) {
    return (
      <div className="m-6 rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {props.loadError}
        <button type="button" onClick={() => window.location.reload()} className="ml-3 font-semibold underline">
          Try again
        </button>
      </div>
    );
  }
  if (!props.meta) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading {props.cmsPage.title}…
      </div>
    );
  }
  return <EditorBody key={props.meta.updatedAt} {...props} meta={props.meta} />;
}
