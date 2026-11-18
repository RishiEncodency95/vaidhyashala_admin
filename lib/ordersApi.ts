import { api } from "./api";

/** Website shop orders (cart → checkout → Razorpay). Backend: /api/cms/orders */
export type PaymentStatus = "pending" | "paid" | "failed";
export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  _id: string;
  orderNumber: string;
  customer: { name: string; mobile: string; email: string };
  address: { line1: string; line2: string; city: string; state: string; pincode: string };
  items: { product: string; title: string; image: string; price: number; mrp: number; qty: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: OrderStatus;
  adminNote: string;
  createdAt: string;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  totalPages: number;
  counts: Partial<Record<PaymentStatus, number>>;
  revenue: number;
}

const BASE = "/cms/orders";

export const ordersApi = {
  list: (params: { payment?: PaymentStatus; search?: string; page?: number }) => {
    const qs = new URLSearchParams({ limit: "50" });
    if (params.payment) qs.set("payment", params.payment);
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    return api.get<OrderListResponse>(`${BASE}?${qs}`);
  },
  update: (id: string, data: { status?: OrderStatus; adminNote?: string }) => api.patch<Order>(`${BASE}/${id}`, data),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`${BASE}/${id}`),
};
