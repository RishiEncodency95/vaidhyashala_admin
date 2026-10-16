import { api } from "./api";

/** Home 1 = website "/" (The Vaidhyashala Health Journal). Backend: /api/cms/home1 */

export interface Home1Hero {
  isActive: boolean;
  breadcrumbHomeLabel: string;
  breadcrumbHomeHref: string;
  breadcrumbCurrentLabel: string;
  titleLine1: string;
  titleLine2: string;
  titleAccent: string;
  subtitle: string;
  backgroundImage: string;
  backgroundImageAlt: string;
}

export interface Home1SearchFilter {
  isActive: boolean;
  searchPlaceholder: string;
  allCategoryLabel: string;
  noResultsMessage: string;
}

export interface Home1Featured {
  isActive: boolean;
  eyebrow: string;
  buttonLabel: string;
  decorativeImage: string;
  decorativeImageAlt: string;
}

export interface Home1ArticlesSection {
  isActive: boolean;
  eyebrow: string;
  heading: string;
  notice: string;
  readMoreLabel: string;
  loadMoreLabel: string;
  initialCount: number;
  loadMoreStep: number;
}

export interface Home1Cta {
  isActive: boolean;
  heading: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
  backgroundImage: string;
  backgroundImageAlt: string;
}

export interface Home1Sections {
  hero: Home1Hero;
  searchFilter: Home1SearchFilter;
  featured: Home1Featured;
  articlesSection: Home1ArticlesSection;
  cta: Home1Cta;
}

export type Home1SectionKey = keyof Home1Sections;

export interface Home1Seo {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  schemaMarkup: string;
  canonicalTag: string;
  openGraphTags: string;
  h1Tag: string;
  breadcrumbName: string;
}

/** Publish box + Page Settings in the Pages & CMS editor */
export interface Home1Publish {
  status: "Published" | "Draft";
  visibility: "Public" | "Private";
  publishedAt: string;
  author: string;
  showInNavigation: boolean;
  menuOrder: number;
}

export interface Home1Page {
  _id: string;
  sections: Home1Sections;
  seo: Home1Seo;
  publish: Home1Publish;
  updatedBy?: string;
  updatedAt: string;
}

export interface Home1Category {
  _id: string;
  name: string;
  slug: string;
  order: number;
  isActive: boolean;
  articleCount?: number;
}

export interface Home1Article {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: Pick<Home1Category, "_id" | "name" | "slug" | "isActive"> | null;
  image: string;
  imageAlt: string;
  link: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  updatedAt: string;
}

export interface Home1ArticleInput {
  title: string;
  slug?: string;
  excerpt?: string;
  category: string;
  image?: string;
  imageAlt?: string;
  link?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface Home1CategoryInput {
  name: string;
  slug?: string;
  order?: number;
  isActive?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ArticleListQuery {
  search?: string;
  category?: string;
  status?: "active" | "inactive" | "";
  page?: number;
  limit?: number;
}

const BASE = "/cms/home1";

export const home1Api = {
  getPage: () => api.get<Home1Page>(BASE),
  updateSection: <K extends Home1SectionKey>(section: K, data: Partial<Home1Sections[K]>) =>
    api.put<Home1Sections[K]>(`${BASE}/sections/${section}`, data),
  updateSeo: (data: Partial<Home1Seo>) => api.put<Home1Seo>(`${BASE}/seo`, data),
  updatePublish: (data: Partial<Home1Publish>) => api.put<Home1Publish>(`${BASE}/publish`, data),
  getDefaults: () => api.get<{ sections: Home1Sections; seo: Home1Seo }>(`${BASE}/defaults`),

  listCategories: () => api.get<Home1Category[]>(`${BASE}/categories`),
  createCategory: (data: Home1CategoryInput) => api.post<Home1Category>(`${BASE}/categories`, data),
  updateCategory: (id: string, data: Partial<Home1CategoryInput>) =>
    api.put<Home1Category>(`${BASE}/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/categories/${id}`),

  listArticles: (query: ArticleListQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    const qs = params.toString();
    return api.get<Paginated<Home1Article>>(`${BASE}/articles${qs ? `?${qs}` : ""}`);
  },
  createArticle: (data: Home1ArticleInput) => api.post<Home1Article>(`${BASE}/articles`, data),
  updateArticle: (id: string, data: Partial<Home1ArticleInput>) =>
    api.put<Home1Article>(`${BASE}/articles/${id}`, data),
  deleteArticle: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/articles/${id}`),
};

/** Images saved as "/hero.webp" live in the website's /public folder: preview them from the website */
export const websiteImageUrl = (src: string): string => {
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return src;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  return `${site}${src.startsWith("/") ? "" : "/"}${src}`;
};
