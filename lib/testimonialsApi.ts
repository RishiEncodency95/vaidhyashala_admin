import { api } from "./api";

/** Patient Testimonials cards. Backend: /api/cms/testimonials (page texts are /api/cms/pages/testimonials) */

export interface Testimonial {
  _id: string;
  name: string;
  category: string;
  quote: string;
  photo: string;
  isSample: boolean;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  feedback?: string;
}

export type TestimonialInput = Partial<Omit<Testimonial, "_id" | "feedback">> & { name: string; category: string; quote: string };

const BASE = "/cms/testimonials";

export const testimonialsApi = {
  list: () => api.get<{ items: Testimonial[]; total: number }>(BASE),
  create: (data: TestimonialInput) => api.post<Testimonial>(BASE, data),
  update: (id: string, data: Partial<TestimonialInput>) => api.put<Testimonial>(`${BASE}/${id}`, data),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/${id}`),
};
