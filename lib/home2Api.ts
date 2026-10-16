import { api } from "./api";
import type { Home1Publish, Home1Seo } from "./home1Api";

/** Home 2 = website "/home". Backend: /api/cms/home2 */

export const HOME2_SECTION_KEYS = [
  "hero",
  "highlights",
  "carePillars",
  "approach",
  "concerns",
  "products",
  "appointment",
  "faq",
  "cta",
] as const;
export type Home2SectionKey = (typeof HOME2_SECTION_KEYS)[number];

/** Each section: its own fields, an isActive switch and (for list sections) an items array */
export type Home2Section = Record<string, unknown> & { isActive?: boolean; items?: Array<Record<string, unknown>> };
export type Home2Sections = Record<Home2SectionKey, Home2Section>;

export interface Home2Page {
  _id: string;
  sections: Home2Sections;
  seo: Home1Seo;
  publish: Home1Publish;
  updatedAt: string;
}

export type AppointmentStatus = "new" | "contacted" | "confirmed" | "cancelled";

export interface AppointmentRequest {
  _id: string;
  service: string;
  serviceLabel: string;
  preferredDate: string;
  consultationType: "clinic" | "online";
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  status: AppointmentStatus;
  adminNote?: string;
  createdAt: string;
}

const BASE = "/cms/home2";

export const home2Api = {
  getPage: () => api.get<Home2Page>(BASE),
  getDefaults: () => api.get<{ sections: Home2Sections; seo: Home1Seo }>(`${BASE}/defaults`),
  updateSection: (section: Home2SectionKey, data: Home2Section) => api.put<Home2Section>(`${BASE}/sections/${section}`, data),
  updateSeo: (data: Partial<Home1Seo>) => api.put<Home1Seo>(`${BASE}/seo`, data),
  updatePublish: (data: Partial<Home1Publish>) => api.put<Home1Publish>(`${BASE}/publish`, data),

  listAppointments: (query: { status?: AppointmentStatus | ""; page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => v !== undefined && v !== "" && params.set(k, String(v)));
    const qs = params.toString();
    return api.get<{
      items: AppointmentRequest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      counts: Partial<Record<AppointmentStatus, number>>;
    }>(`${BASE}/appointments${qs ? `?${qs}` : ""}`);
  },
  updateAppointment: (id: string, data: { status?: AppointmentStatus; adminNote?: string }) =>
    api.patch<AppointmentRequest>(`${BASE}/appointments/${id}`, data),
  deleteAppointment: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/appointments/${id}`),
};
