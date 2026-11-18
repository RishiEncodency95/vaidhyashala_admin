"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import Modal from "@/components/ui/Modal";
import { ApiRequestError } from "@/lib/api";
import { ordersApi, type Order, type OrderListResponse, type OrderStatus, type PaymentStatus } from "@/lib/ordersApi";

/* Website shop orders: cart → checkout → Razorpay. Backend: /api/cms/orders */

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  background: "#1e2433",
  color: "#e2e8f0",
});
const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiRequestError || err instanceof Error ? err.message || fallback : fallback;

const rupees = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (v: string) =>
  new Date(v).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

const TH = "whitespace-nowrap px-[10px] py-[7px] text-[10.5px] font-bold uppercase tracking-wide text-white";
const TABS: { key: PaymentStatus | ""; label: string }[] = [
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Payment pending" },
  { key: "failed", label: "Failed" },
  { key: "", label: "All" },
];
const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const PAYMENT_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function OrdersPage() {
  const [tab, setTab] = useState<PaymentStatus | "">("paid");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<Order | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await ordersApi.list({ payment: tab || undefined, search: query, page }));
      setError("");
    } catch (err) {
      setError(errorText(err, "Could not load the orders."));
    } finally {
      setLoading(false);
    }
  }, [tab, query, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    load();
  }, [load]);

  // Search after the admin stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const replace = (o: Order) => {
    setData((d) => (d ? { ...d, items: d.items.map((x) => (x._id === o._id ? o : x)) } : d));
    setOpen((cur) => (cur && cur._id === o._id ? o : cur));
  };

  const setStatus = async (o: Order, status: OrderStatus) => {
    try {
      replace(await ordersApi.update(o._id, { status }));
      Toast.fire({ icon: "success", iconColor: "#34d399", title: `Marked as ${status}` });
    } catch (err) {
      Toast.fire({ icon: "error", iconColor: "#f87171", title: errorText(err, "Could not update the order.") });
    }
  };

  const saveNote = async () => {
    if (!open) return;
    setSaving(true);
    try {
      replace(await ordersApi.update(open._id, { adminNote: note }));
      Toast.fire({ icon: "success", iconColor: "#34d399", title: "Note saved" });
    } catch (err) {
      Toast.fire({ icon: "error", iconColor: "#f87171", title: errorText(err, "Could not save the note.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (o: Order) => {
    const res = await Swal.fire({
      title: `Delete order ${o.orderNumber}?`,
      text: "Only unpaid orders can be deleted. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!res.isConfirmed) return;
    try {
      await ordersApi.remove(o._id);
      setOpen(null);
      await load();
      Toast.fire({ icon: "success", iconColor: "#34d399", title: "Order deleted" });
    } catch (err) {
      Swal.fire({ title: "Could not delete", text: errorText(err, "Please try again."), icon: "error" });
    }
  };

  const counts = data?.counts ?? {};

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]">
      <div className="flex min-h-full flex-col px-[18px] pb-[16px] pt-[14px]">
        <div className="mb-[14px] flex flex-wrap items-end justify-between gap-[10px] border-b-[2px] border-[#293681] pb-[10px]">
          <div>
            <h1 className="text-[22px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]">Orders</h1>
            <p className="mt-0.5 text-[12px] font-medium text-[#6c7587]">Orders placed from the website cart and paid with Razorpay.</p>
          </div>
          <div className="rounded-[7px] border border-emerald-200 bg-emerald-50 px-4 py-2 text-right">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">Paid revenue</p>
            <p className="text-[18px] font-bold text-emerald-800">{rupees(data?.revenue ?? 0)}</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[7px] border border-[#e8e5df] bg-white">
          <div className="flex flex-wrap items-center gap-[20px] border-b border-[#e8e5df] px-[16px] pt-[11px]">
            {TABS.map((t) => {
              const n = t.key ? counts[t.key] ?? 0 : Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTab(t.key);
                    setPage(1);
                  }}
                  className={`relative pb-[9px] text-[12.5px] font-bold ${tab === t.key ? "text-[#166b40]" : "text-[#6c7587] hover:text-[#18233b]"}`}
                >
                  {t.label} ({n})
                  {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#166b40]" />}
                </button>
              );
            })}
          </div>

          <div className="border-b border-[#f0f0ec] px-[16px] py-[10px]">
            <div className="relative max-w-[420px]">
              <Search className="pointer-events-none absolute left-[9px] top-1/2 h-[13px] w-[13px] -translate-y-1/2 text-[#9aa0aa]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order number, name, mobile or email..."
                className="h-[32px] w-full rounded-[5px] border border-[#e5e6e2] pl-[28px] pr-[9px] text-[12px] font-medium text-[#414b5e] outline-none focus:border-[#8fa98e]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="bg-[#233D4D]">
                  <th className={TH}>Order</th>
                  <th className={TH}>Customer</th>
                  <th className={TH}>Items</th>
                  <th className={`${TH} text-right`}>Total</th>
                  <th className={`${TH} text-center`}>Payment</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {loading && !data ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[12px] text-[#6c7587]">Loading orders…</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[12px] font-semibold text-red-600">{error}</td></tr>
                ) : !data?.items.length ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[12px] text-[#6c7587]">No orders here yet.</td></tr>
                ) : (
                  data.items.map((o) => (
                    <tr
                      key={o._id}
                      onClick={() => {
                        setOpen(o);
                        setNote(o.adminNote || "");
                      }}
                      className="cursor-pointer hover:bg-slate-50/80"
                    >
                      <td className="px-[10px] py-[9px] text-[12.5px] font-bold text-[#18233b]">{o.orderNumber}</td>
                      <td className="px-[10px] py-[9px]">
                        <p className="text-[12.5px] font-bold text-[#18233b]">{o.customer.name}</p>
                        <p className="text-[11.5px] text-[#6c7587]">{o.customer.mobile}</p>
                      </td>
                      <td className="max-w-[260px] truncate px-[10px] py-[9px] text-[12px] text-[#334155]">
                        {o.items.map((i) => `${i.title} × ${i.qty}`).join(", ")}
                      </td>
                      <td className="px-[10px] py-[9px] text-right text-[13px] font-bold text-[#18233b]">{rupees(o.total)}</td>
                      <td className="px-[10px] py-[9px] text-center">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${PAYMENT_BADGE[o.paymentStatus]}`}>{cap(o.paymentStatus)}</span>
                      </td>
                      <td className="px-[10px] py-[9px]" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={o.status}
                          onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                          className="h-[28px] rounded-[5px] border border-[#e5e6e2] bg-white px-1.5 text-[12px] font-semibold text-[#414b5e]"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-[10px] py-[9px] text-[12px] text-[#6c7587]">{when(o.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[8px] text-[11.5px] font-semibold text-[#5f6a7c]">
              <span>Page {data.page} of {data.totalPages} · {data.total} orders</span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border bg-white p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border bg-white p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!open} onClose={() => setOpen(null)} title={open ? `Order ${open.orderNumber}` : ""} size="lg">
        {open && (
          <div className="space-y-4 text-[13px] text-[#334155]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[#e8e5df] p-3">
                <p className="text-[10.5px] font-bold uppercase text-[#6c7587]">Customer</p>
                <p className="mt-1 font-bold text-[#18233b]">{open.customer.name}</p>
                <p><a className="text-sky-700" href={`tel:${open.customer.mobile}`}>{open.customer.mobile}</a></p>
                {open.customer.email && <p><a className="text-sky-700" href={`mailto:${open.customer.email}`}>{open.customer.email}</a></p>}
              </div>
              <div className="rounded-lg border border-[#e8e5df] p-3">
                <p className="text-[10.5px] font-bold uppercase text-[#6c7587]">Deliver to</p>
                <p className="mt-1">{open.address.line1}</p>
                {open.address.line2 && <p>{open.address.line2}</p>}
                <p>{open.address.city}, {open.address.state} – {open.address.pincode}</p>
              </div>
            </div>

            <table className="w-full text-[13px]">
              <tbody className="divide-y divide-[#f0f0ec]">
                {open.items.map((i) => (
                  <tr key={i.product}>
                    <td className="py-1.5">{i.title} <span className="text-[#6c7587]">× {i.qty} @ {rupees(i.price)}</span></td>
                    <td className="py-1.5 text-right font-semibold">{rupees(i.price * i.qty)}</td>
                  </tr>
                ))}
                {open.discount > 0 && (
                  <tr><td className="py-1.5 text-emerald-700">Discount (from MRP)</td><td className="py-1.5 text-right text-emerald-700">− {rupees(open.discount)}</td></tr>
                )}
                <tr><td className="py-2 font-bold text-[#18233b]">Total</td><td className="py-2 text-right text-[15px] font-bold text-[#18233b]">{rupees(open.total)}</td></tr>
              </tbody>
            </table>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${PAYMENT_BADGE[open.paymentStatus]}`}>Payment: {cap(open.paymentStatus)}</span>
              {open.razorpayPaymentId && <span className="text-[11.5px] text-[#6c7587]">Razorpay: {open.razorpayPaymentId}</span>}
              <label className="ml-auto flex items-center gap-2 text-[12px] font-semibold">
                Status
                <select value={open.status} onChange={(e) => setStatus(open, e.target.value as OrderStatus)} className="h-[30px] rounded-[5px] border border-[#e5e6e2] px-1.5">
                  {STATUSES.map((s) => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
              </label>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-bold uppercase text-[#6c7587]">Clinic note (not shown to the customer)</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="e.g. Courier AWB 12345, called customer on 18 Nov"
                className="w-full rounded-[6px] border border-[#e5e6e2] p-2 text-[13px] outline-none focus:border-[#8fa98e]"
              />
              <div className="mt-2 flex items-center justify-between">
                {open.paymentStatus !== "paid" ? (
                  <button onClick={() => remove(open)} className="inline-flex items-center gap-1 text-[12px] font-bold text-red-600 hover:underline">
                    <Trash2 className="h-3.5 w-3.5" /> Delete unpaid order
                  </button>
                ) : <span />}
                <button
                  onClick={saveNote}
                  disabled={saving || note === (open.adminNote || "")}
                  className="inline-flex h-[32px] items-center gap-1.5 rounded-[6px] bg-[#166b40] px-4 text-[12px] font-bold text-white disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save note
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
