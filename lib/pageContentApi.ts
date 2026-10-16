import { api } from "./api";
import type { Home1Publish, Home1Seo } from "./home1Api";

/** Pages & CMS pages backed by /api/cms/pages/:pageKey (About Us, About Story, …) */

export type ContentSection = Record<string, unknown> & { isActive?: boolean; items?: Array<Record<string, unknown>> };

export interface ContentPage {
  key: string;
  title: string;
  path: string;
  sectionOrder: string[];
  sections: Record<string, ContentSection>;
  seo: Home1Seo;
  publish: Home1Publish;
  updatedAt: string;
}

const base = (pageKey: string) => `/cms/pages/${encodeURIComponent(pageKey)}`;

export const pageContentApi = {
  getPage: (pageKey: string) => api.get<ContentPage>(base(pageKey)),
  getDefaults: (pageKey: string) =>
    api.get<{ sections: Record<string, ContentSection>; seo: Home1Seo }>(`${base(pageKey)}/defaults`),
  updateSection: (pageKey: string, section: string, data: ContentSection) =>
    api.put<ContentSection>(`${base(pageKey)}/sections/${section}`, data),
  updateSeo: (pageKey: string, data: Partial<Home1Seo>) => api.put<Home1Seo>(`${base(pageKey)}/seo`, data),
  updatePublish: (pageKey: string, data: Partial<Home1Publish>) => api.put<Home1Publish>(`${base(pageKey)}/publish`, data),
};
