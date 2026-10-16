import { api } from "./api";

/** Products page catalogue. Backend: /api/cms/products (page texts are /api/cms/pages/products) */

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  productCount?: number;
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  category: Pick<ProductCategory, "_id" | "name" | "slug" | "isActive"> | null;
  shortDescription: string;
  description: string;
  productType: string;
  packOptions: string;
  availability: string;
  productInfo: string;
  directions: string;
  usageNotes: string;
  image: string;
  imageAlt: string;
  galleryImage1: string;
  galleryImage2: string;
  isActive: boolean;
  order: number;
}

export type ProductInput = Partial<Omit<Product, "_id" | "category">> & { title: string; category: string };
export type ProductCategoryInput = { name: string; slug?: string; order?: number; isActive?: boolean };

const BASE = "/cms/products";

export const productsApi = {
  listCategories: () => api.get<ProductCategory[]>(`${BASE}/categories`),
  createCategory: (data: ProductCategoryInput) => api.post<ProductCategory>(`${BASE}/categories`, data),
  updateCategory: (id: string, data: Partial<ProductCategoryInput>) => api.put<ProductCategory>(`${BASE}/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/categories/${id}`),

  listProducts: () => api.get<{ items: Product[]; total: number }>(BASE),
  createProduct: (data: ProductInput) => api.post<Product>(BASE, data),
  updateProduct: (id: string, data: Partial<ProductInput>) => api.put<Product>(`${BASE}/${id}`, data),
  deleteProduct: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/${id}`),
};
