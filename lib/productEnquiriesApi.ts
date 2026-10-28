import { api } from "./api";

/** Products page enquiries: the "Enquire about a product" form and the product popup's enquiry form */
export type ProductEnquiryStatus = "new" | "contacted" | "closed";
export type ProductEnquirySource = "page-form" | "product-modal";

export interface ProductEnquiry {
  _id: string;
  source: ProductEnquirySource;
  name: string;
  mobile: string;
  email?: string;
  productName: string;
  product?: { _id: string; title?: string; slug?: string } | null;
  enquiryType?: string;
  message?: string;
  status: ProductEnquiryStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductEnquiryListResponse {
  items: ProductEnquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: Partial<Record<ProductEnquiryStatus, number>>;
}

const BASE = "/cms/products/enquiries";

export const productEnquiriesApi = {
  /** Every enquiry, newest first (the API gives at most 100 per page, so all pages are read) */
  listAll: async (): Promise<ProductEnquiry[]> => {
    const all: ProductEnquiry[] = [];
    for (let page = 1; ; page += 1) {
      const res = await api.get<ProductEnquiryListResponse>(`${BASE}?page=${page}&limit=100`);
      all.push(...(res.items || []));
      if (page >= (res.totalPages || 1)) break;
    }
    return all;
  },
  update: (id: string, data: { status?: ProductEnquiryStatus; adminNote?: string }) =>
    api.patch<ProductEnquiry>(`${BASE}/${id}`, data),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/${id}`),
};
