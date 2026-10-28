"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  Inbox,
  Mail,
  MessageSquareText,
  Package,
  Phone,
  PhoneCall,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import Swal from "sweetalert2";
import typography from "../pages/PagesTypography.module.css";
import Modal from "@/components/ui/Modal";
import { ApiRequestError } from "@/lib/api";
import {
  productEnquiriesApi,
  type ProductEnquiry,
  type ProductEnquirySource,
  type ProductEnquiryStatus,
} from "@/lib/productEnquiriesApi";

/* =========================================================
   Same layout as "Contact Us Messages", for the Products
   page's enquiry form and the product popup's enquiry form.
========================================================= */

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  background: "#1e2433",
  color: "#e2e8f0",
});

const showSuccess = (title: string) => Toast.fire({ icon: "success", iconColor: "#34d399", title });
const showError = (title: string) => Toast.fire({ icon: "error", iconColor: "#f87171", title });

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

/** yyyy-mm-dd of a timestamp in the browser's own timezone, to compare with the date pickers */
const localDay = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isWithinLastDays = (value: string, days: number) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
};

/** Digits for a wa.me link; a bare 10-digit Indian mobile gets the 91 prefix */
const whatsappNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const STATUS_STYLES: Record<ProductEnquiryStatus, string> = {
  new: "bg-[#fff8e1] text-[#b78103] border border-[#ffe082]",
  contacted: "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]",
  closed: "bg-[#e8f5e9] text-[#23714a] border border-[#a5d6a7]",
};
const STATUS_LABEL: Record<ProductEnquiryStatus, string> = { new: "New", contacted: "Contacted", closed: "Closed" };
const SOURCE_LABEL: Record<ProductEnquirySource, string> = {
  "page-form": "Products page form",
  "product-modal": "Product popup",
};
const SELECT_ARROW = (size: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const toneClass = {
  slate: "bg-slate-50 text-slate-700 ring-slate-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
} as const;

interface StatCardItem {
  title: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof toneClass;
  gradient: string;
  borderColor: string;
  numColor: string;
  footer: string;
  onClick: () => void;
}

const PAGE_SIZE = 10;

const TABS: { key: "all" | ProductEnquiryStatus; label: string }[] = [
  { key: "all", label: "All Enquiries" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "closed", label: "Closed" },
];

const TH = "whitespace-nowrap px-[8px] py-[5px] text-[7.5px] font-bold text-white uppercase tracking-wide";
const DATE_INPUT =
  "h-[26px] rounded-[5px] border border-[#e5e6e2] bg-white px-[6px] text-[9.5px] font-medium normal-case text-[#414b5e] outline-none focus:border-[#8fa98e]";

export default function ProductEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<ProductEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | ProductEnquiryStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewing, setViewing] = useState<ProductEnquiry | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = () =>
    productEnquiriesApi
      .listAll()
      .then((items) => {
        setEnquiries(items);
        setLoadError(null);
      })
      .catch((err) => setLoadError(err instanceof ApiRequestError ? err.message : "Failed to load product enquiries."))
      .finally(() => setLoading(false));

  useEffect(() => {
    // First load: the state already starts as loading
    fetchItems();
  }, []);

  const changeTab = (next: typeof tab) => {
    setTab(next);
    setPage(1);
  };

  const openEnquiry = (enquiry: ProductEnquiry) => {
    setViewing(enquiry);
    setNote(enquiry.adminNote ?? "");
  };

  const handleStatusChange = async (id: string, nextStatus: ProductEnquiryStatus) => {
    const previous = enquiries;
    setEnquiries((prev) => prev.map((e) => (e._id === id ? { ...e, status: nextStatus } : e)));
    setViewing((v) => (v && v._id === id ? { ...v, status: nextStatus } : v));
    setUpdatingId(id);
    try {
      await productEnquiriesApi.update(id, { status: nextStatus });
      showSuccess(`Marked as "${STATUS_LABEL[nextStatus]}"`);
    } catch (err) {
      setEnquiries(previous);
      setViewing((v) => (v && v._id === id ? previous.find((e) => e._id === id) ?? v : v));
      showError(err instanceof ApiRequestError ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const saveNote = async () => {
    if (!viewing) return;
    setSavingNote(true);
    try {
      await productEnquiriesApi.update(viewing._id, { adminNote: note.trim() });
      setEnquiries((prev) => prev.map((e) => (e._id === viewing._id ? { ...e, adminNote: note.trim() } : e)));
      setViewing((v) => (v ? { ...v, adminNote: note.trim() } : v));
      showSuccess("Note saved");
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : "Failed to save the note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (enquiry: ProductEnquiry) => {
    const result = await Swal.fire({
      title: `Delete enquiry from "${enquiry.name}"?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      background: "#1e2433",
      color: "#e2e8f0",
    });
    if (!result.isConfirmed) return;

    // Deleted from the database first; the row only leaves the table once the server has done it
    try {
      await productEnquiriesApi.remove(enquiry._id);
      setEnquiries((prev) => prev.filter((e) => e._id !== enquiry._id));
      setViewing((v) => (v && v._id === enquiry._id ? null : v));
      showSuccess("Enquiry deleted");
    } catch (err) {
      Swal.fire({
        title: "Could not delete the enquiry",
        text: err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.",
        icon: "error",
        background: "#1e2433",
        color: "#e2e8f0",
      });
    }
  };

  const copyToClipboard = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopiedField(label);
      showSuccess(`${label} copied!`);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopiedField(null), 1500);
    });
  };

  // The date filter narrows the tabs, the status cards and the table; "Today" and "Last 7 days" always count everything
  const dated = useMemo(
    () =>
      enquiries.filter((e) => {
        if (!dateFrom && !dateTo) return true;
        const day = localDay(e.createdAt);
        return (!dateFrom || day >= dateFrom) && (!dateTo || day <= dateTo);
      }),
    [enquiries, dateFrom, dateTo]
  );

  const counts = useMemo(
    () => ({
      all: dated.length,
      new: dated.filter((e) => e.status === "new").length,
      contacted: dated.filter((e) => e.status === "contacted").length,
      closed: dated.filter((e) => e.status === "closed").length,
      today: enquiries.filter((e) => isSameDay(new Date(e.createdAt), new Date())).length,
      week: enquiries.filter((e) => isWithinLastDays(e.createdAt, 7)).length,
    }),
    [dated, enquiries]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dated.filter((e) => {
      if (tab !== "all" && e.status !== tab) return false;
      if (!q) return true;
      return [e.name, e.email, e.mobile, e.productName, e.enquiryType, e.message].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [dated, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filtered.length);
  const paginatedRows = filtered.slice(startIndex, endIndex);

  const statCards: StatCardItem[] = [
    { title: "TOTAL ENQUIRIES", value: counts.all, icon: Inbox, tone: "slate", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #e2e8f0 100%)", borderColor: "#e2e8f0", numColor: "#334155", footer: "View all enquiries", onClick: () => changeTab("all") },
    { title: "NEW", value: counts.new, icon: Clock3, tone: "amber", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #fed7aa 100%)", borderColor: "#fed7aa", numColor: "#c2410c", footer: "View new", onClick: () => changeTab("new") },
    { title: "CONTACTED", value: counts.contacted, icon: PhoneCall, tone: "blue", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #bae6fd 100%)", borderColor: "#bae6fd", numColor: "#0284c7", footer: "View contacted", onClick: () => changeTab("contacted") },
    { title: "CLOSED", value: counts.closed, icon: CheckCircle2, tone: "emerald", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #bbf7d0 100%)", borderColor: "#bbf7d0", numColor: "#15803d", footer: "View closed", onClick: () => changeTab("closed") },
    { title: "TODAY", value: counts.today, icon: Sparkles, tone: "violet", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #ddd6fe 100%)", borderColor: "#ddd6fe", numColor: "#6d28d9", footer: "New today", onClick: () => changeTab("all") },
    { title: "LAST 7 DAYS", value: counts.week, icon: MessageSquareText, tone: "teal", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #99f6e4 100%)", borderColor: "#99f6e4", numColor: "#0f766e", footer: "This week", onClick: () => changeTab("all") },
  ];

  const statusSelect = (enquiry: ProductEnquiry, big?: boolean) => (
    <select
      value={enquiry.status}
      disabled={updatingId === enquiry._id}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handleStatusChange(enquiry._id, e.target.value as ProductEnquiryStatus)}
      className={`cursor-pointer appearance-none rounded-[4px] font-bold outline-none bg-no-repeat shadow-xs transition disabled:opacity-50 ${
        big ? "h-[26px] px-[10px] pr-[24px] text-[9px] bg-[right_7px_center]" : "h-[18px] px-[6px] pr-[18px] text-[7px] bg-[right_5px_center]"
      } ${STATUS_STYLES[enquiry.status]}`}
      style={{ backgroundImage: SELECT_ARROW(big ? 9 : 8) }}
    >
      <option value="new" className="bg-white font-bold text-[#b78103]">New</option>
      <option value="contacted" className="bg-white font-bold text-[#0369a1]">Contacted</option>
      <option value="closed" className="bg-white font-bold text-[#23714a]">Closed</option>
    </select>
  );

  return (
    <div className={`${typography.pages} min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]`}>
      <div className="flex min-h-full flex-col px-[18px] pb-[16px] pt-[14px]">
        {/* HEADER */}
        <div className="mb-[14px] flex flex-wrap items-start justify-between gap-[10px] border-b-[2px] border-[#293681] pb-[10px]">
          <div>
            <h1 className="text-[19px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]">Product Enquiries</h1>
            <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">
              Submissions from the website&apos;s Products page: the &quot;Enquire about a product&quot; form and the product popup&apos;s
              enquiry form.
            </p>
          </div>

          {/* DATE FILTER */}
          <div className="flex flex-wrap items-center gap-[6px]">
            <CalendarDays className="h-[13px] w-[13px] text-[#6c7587]" />
            <label className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wide text-[#6c7587]">
              From
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className={DATE_INPUT}
              />
            </label>
            <label className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wide text-[#6c7587]">
              To
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className={DATE_INPUT}
              />
            </label>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
                className="inline-flex h-[26px] items-center gap-1 rounded-[5px] border border-[#e5e6e2] bg-white px-[8px] text-[9px] font-bold text-[#6c7587] transition hover:bg-slate-50 hover:text-[#18233b]"
              >
                <X className="h-[10px] w-[10px]" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* STATS ROW */}
        <div className="mb-[12px] grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="relative flex h-[82px] flex-col overflow-hidden rounded-[10px] border border-[#e5e7e6] bg-white p-1.5 !pb-4.5 transition-all hover:translate-y-[-1px]"
                style={{
                  background: item.gradient,
                  borderColor: item.borderColor || undefined,
                  boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px",
                }}
              >
                <div className="flex items-start gap-1.5">
                  <div className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full ring-1 bg-white/80 shadow-xs ${toneClass[item.tone]}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[7px] !font-semibold tracking-[0.01em] text-slate-900" style={{ fontWeight: 600, color: "#0f172a" }}>
                      {item.title}
                    </p>
                    <div className="mt-1 flex items-end justify-between">
                      <span className="text-[16px] !font-semibold leading-none tracking-[-0.04em]" style={{ color: item.numColor, fontWeight: 600 }}>
                        {item.value}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  onClick={item.onClick}
                  className="absolute bottom-1 left-1.5 right-1.5 flex cursor-pointer items-center justify-center gap-1 text-[7px] font-semibold text-[#293957] transition hover:text-blue-600"
                >
                  {item.footer}
                  <ArrowRight className="h-2.5 w-2.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* TABLE CARD */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[7px] border border-[#e8e5df] bg-white">
          {/* TABS */}
          <div className="flex flex-wrap items-center gap-[20px] border-b border-[#e8e5df] px-[16px] pt-[11px]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => changeTab(t.key)}
                className={`relative pb-[9px] text-[10px] font-bold transition-colors ${tab === t.key ? "text-[#166b40]" : "text-[#6c7587] hover:text-[#18233b]"}`}
              >
                {t.label} ({counts[t.key]})
                {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#166b40]" />}
              </button>
            ))}
          </div>

          {/* SEARCH BAR */}
          <div className="flex flex-wrap items-center gap-[8px] border-b border-[#f0f0ec] px-[16px] py-[10px]">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-[9px] top-1/2 h-[12px] w-[12px] -translate-y-1/2 text-[#9aa0aa]" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, mobile number, product, enquiry type or message..."
                className="h-[30px] w-full rounded-[5px] border border-[#e5e6e2] bg-white pl-[26px] pr-[9px] text-[9.5px] font-medium text-[#414b5e] outline-none placeholder:text-[#9aa0aa] focus:border-[#8fa98e]"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="h-[26px] border-b border-[#e8e5df] bg-[#233D4D]">
                  <th className={`w-[28px] ${TH}`}>S.No</th>
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Mobile No.</th>
                  <th className={TH}>Product</th>
                  <th className={TH}>Enquiry Type</th>
                  <th className={TH}>Form</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Received</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[10px] text-[#6c7587]">
                      Loading product enquiries…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[10px] font-semibold text-red-600">
                      {loadError}
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[10px] text-[#6c7587]">
                      No enquiries match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((enquiry, rowIndex) => (
                    <tr key={enquiry._id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-semibold text-[#6c7587]">{startIndex + rowIndex + 1}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px]">
                        <button type="button" onClick={() => openEnquiry(enquiry)} className="text-[8px] font-bold text-[#4B1426] hover:underline">
                          {enquiry.name}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-medium text-[#334155]">{enquiry.email || "—"}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-bold text-[#166534]">{enquiry.mobile}</td>
                      <td className="max-w-[150px] truncate px-[8px] py-[5px] text-[8px] font-medium text-[#334155]" title={enquiry.productName}>
                        {enquiry.productName}
                      </td>
                      <td className="max-w-[140px] truncate px-[8px] py-[5px] text-[8px] font-medium text-[#334155]" title={enquiry.enquiryType}>
                        {enquiry.enquiryType || "—"}
                      </td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[7.5px] font-medium text-[#6c7587]">
                        {enquiry.source === "product-modal" ? "Popup" : "Page form"}
                      </td>
                      <td className="whitespace-nowrap px-[8px] py-[5px]">{statusSelect(enquiry)}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[7.5px] font-medium text-[#6c7587]">{formatDateTime(enquiry.createdAt)}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="View Enquiry"
                            onClick={() => openEnquiry(enquiry)}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-orange-500/10 text-orange-600 backdrop-blur-md border border-orange-400/30 shadow-[0_2px_6px_rgba(249,115,22,0.12)] transition-all hover:bg-orange-500/20 hover:border-orange-400/50 hover:shadow-[0_3px_10px_rgba(249,115,22,0.25)] hover:scale-105 active:scale-95"
                          >
                            <Eye className="h-[10px] w-[10px] text-orange-600" />
                          </button>
                          <a
                            href={`https://wa.me/${whatsappNumber(enquiry.mobile)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Message on WhatsApp"
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-emerald-500/10 text-emerald-600 backdrop-blur-md border border-emerald-400/30 shadow-[0_2px_6px_rgba(16,185,129,0.12)] transition-all hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_3px_10px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95"
                          >
                            <Phone className="h-[10px] w-[10px] text-emerald-600" />
                          </a>
                          <button
                            type="button"
                            title="Delete Enquiry"
                            onClick={() => handleDelete(enquiry)}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-red-500/10 text-red-600 backdrop-blur-md border border-red-400/30 shadow-[0_2px_6px_rgba(220,38,38,0.12)] transition-all hover:bg-red-500/20 hover:border-red-400/50 hover:shadow-[0_3px_10px_rgba(220,38,38,0.25)] hover:scale-105 active:scale-95"
                          >
                            <Trash2 className="h-[10px] w-[10px] text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[8px] text-[8px]">
              <span className="font-semibold text-[#5f6a7c]">
                Showing {startIndex + 1} to {endIndex} of {filtered.length} enquiries
              </span>
              <div className="flex items-center gap-[4px]">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border border-[#d8dce2] bg-white text-[#334155] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] border px-1.5 text-[8px] font-bold transition ${
                      safePage === pageNum ? "border-[#233D4D] bg-[#233D4D] text-white shadow-xs" : "border-[#d8dce2] bg-white text-[#334155] hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border border-[#d8dce2] bg-white text-[#334155] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW ENQUIRY MODAL */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title="Product Enquiry"
        size="md"
        footer={
          viewing && (
            <>
              <button
                type="button"
                onClick={() => handleDelete(viewing)}
                className="inline-flex h-[32px] items-center gap-1.5 px-[14px] text-[12px] font-semibold text-red-600 transition-all hover:bg-red-100 active:scale-95"
                style={{ background: "#fff1f2", borderRadius: "4px", boxShadow: "rgba(0,0,0,0.02) 0px 1px 3px 0px, rgba(220,38,38,0.15) 0px 0px 0px 1px" }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <a
                href={`https://wa.me/${whatsappNumber(viewing.mobile)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[32px] items-center gap-1.5 px-[14px] text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#16a34a", borderRadius: "4px", boxShadow: "rgba(0,0,0,0.02) 0px 1px 3px 0px, rgba(22,163,74,0.2) 0px 0px 0px 1px" }}
              >
                <Phone className="h-3.5 w-3.5" />
                Reply on WhatsApp
              </a>
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-[#18233b]">{viewing.name}</p>
                <p className="text-[10px] font-medium text-[#6c7587]">{formatDateTime(viewing.createdAt)}</p>
              </div>
              {statusSelect(viewing, true)}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Mobile Number", value: viewing.mobile, icon: Phone, copy: true },
                { label: "Email", value: viewing.email || "—", icon: Mail, copy: !!viewing.email },
                { label: "Product", value: viewing.productName, icon: Package, copy: false },
                { label: "Enquiry Type", value: viewing.enquiryType || "—", icon: Tag, copy: false },
                { label: "Submitted From", value: SOURCE_LABEL[viewing.source] ?? viewing.source, icon: MessageSquareText, copy: false },
              ].map(({ label, value, icon: FieldIcon, copy }) => (
                <div key={label} className="rounded-[4px] border border-[#e4e7eb] bg-[#f8fafc] px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-[#94a3b8]">
                      <FieldIcon className="h-2.5 w-2.5" />
                      {label}
                    </p>
                    {copy && (
                      <button type="button" onClick={() => copyToClipboard(label, value)} className="text-[#64748b] hover:text-[#0284c7]" title={`Copy ${label}`}>
                        {copiedField === label ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> : <Copy className="h-2.5 w-2.5" />}
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-[#1e293b]" title={value}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-[#94a3b8]">Message</p>
              <div className="rounded-[4px] border border-[#e4e7eb] bg-[#f8fafc] p-3 text-[11px] leading-relaxed text-[#334155] whitespace-pre-wrap">
                {viewing.message || "—"}
              </div>
            </div>

            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-[#94a3b8]">Internal Note</p>
              <textarea
                rows={3}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Only visible to the admin team"
                className="w-full rounded-[4px] border border-[#e4e7eb] bg-white p-2 text-[11px] text-[#334155] outline-none focus:border-[#8fa98e]"
              />
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={saveNote}
                  disabled={savingNote || note.trim() === (viewing.adminNote ?? "")}
                  className="inline-flex h-[28px] items-center px-[12px] text-[11px] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "#233D4D", borderRadius: "4px" }}
                >
                  {savingNote ? "Saving…" : "Save note"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
