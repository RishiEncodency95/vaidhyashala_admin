"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Eye,
  Inbox,
  Mail,
  MessageSquareText,
  Phone,
  PhoneCall,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Swal from "sweetalert2";
import typography from "@/app/(dashboard)/pages/PagesTypography.module.css";
import Modal from "@/components/ui/Modal";
import { ApiRequestError } from "@/lib/api";
import { home2Api, type AppointmentRequest, type AppointmentSource, type AppointmentStatus } from "@/lib/home2Api";

/* =========================================================
   Same layout as "Contact Us Messages", for the appointment
   and consultation forms on the website.
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

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isWithinLastDays = (value: string, days: number) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.getTime() >= Date.now() - days * 24 * 60 * 60 * 1000;
};

/** Digits for a wa.me link; a bare 10-digit Indian mobile gets the 91 prefix */
const whatsappNumber = (phone?: string) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  new: "bg-[#fff8e1] text-[#b78103] border border-[#ffe082]",
  contacted: "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]",
  confirmed: "bg-[#e8f5e9] text-[#23714a] border border-[#a5d6a7]",
  cancelled: "bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]",
};
const STATUS_LABEL: Record<AppointmentStatus, string> = { new: "New", contacted: "Contacted", confirmed: "Confirmed", cancelled: "Cancelled" };
const STATUS_ORDER: AppointmentStatus[] = ["new", "contacted", "confirmed", "cancelled"];
const SELECT_ARROW = (size: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const SOURCE_LABEL: Record<AppointmentSource, string> = {
  home2: "Home · Plan your first visit",
  consultation: "Plan your consultation popup",
  panchakarma: "Panchakarma · Request a consultation",
};

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
const TABS: { key: "all" | AppointmentStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

const TH = "whitespace-nowrap px-[8px] py-[5px] text-[7.5px] font-bold text-white uppercase tracking-wide";

export interface AppointmentRequestsViewProps {
  title: string;
  subtitle: string;
  /** What one row is called, e.g. "appointment" -> "Total appointments" */
  noun: string;
  /** Which website forms this page lists */
  sources: AppointmentSource[];
  /** Consultation forms also collect an email and a time slot */
  showEmailAndTime?: boolean;
  icon: "appointment" | "consultation";
}

export default function AppointmentRequestsView({ title, subtitle, noun, sources, showEmailAndTime, icon }: AppointmentRequestsViewProps) {
  const [rows, setRows] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<AppointmentRequest | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourcesKey = sources.join(",");

  const fetchAll = useCallback(async () => {
    try {
      // The API gives at most 100 per page: read every page of every source this page lists
      const all: AppointmentRequest[] = [];
      for (const source of sourcesKey.split(",") as AppointmentSource[]) {
        let p = 1;
        for (;;) {
          const res = await home2Api.listAppointments({ source, page: p, limit: 100 });
          all.push(...res.items);
          if (p >= res.totalPages) break;
          p += 1;
        }
      }
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRows(all);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiRequestError ? err.message : `Failed to load ${noun}s.`);
    } finally {
      setLoading(false);
    }
  }, [sourcesKey, noun]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load
    fetchAll();
  }, [fetchAll]);

  const changeTab = (next: typeof tab) => {
    setTab(next);
    setPage(1);
  };

  const openRow = (row: AppointmentRequest) => {
    setViewing(row);
    setNote(row.adminNote ?? "");
  };

  const handleStatusChange = async (id: string, next: AppointmentStatus) => {
    const previous = rows;
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: next } : r)));
    setViewing((v) => (v && v._id === id ? { ...v, status: next } : v));
    setUpdatingId(id);
    try {
      await home2Api.updateAppointment(id, { status: next });
      showSuccess(`Marked as "${STATUS_LABEL[next]}"`);
    } catch (err) {
      setRows(previous);
      setViewing((v) => (v && v._id === id ? previous.find((r) => r._id === id) ?? v : v));
      showError(err instanceof ApiRequestError ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const saveNote = async () => {
    if (!viewing) return;
    setSavingNote(true);
    try {
      await home2Api.updateAppointment(viewing._id, { adminNote: note.trim() });
      setRows((prev) => prev.map((r) => (r._id === viewing._id ? { ...r, adminNote: note.trim() } : r)));
      setViewing((v) => (v ? { ...v, adminNote: note.trim() } : v));
      showSuccess("Note saved");
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : "Failed to save the note.");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (row: AppointmentRequest) => {
    const result = await Swal.fire({
      title: `Delete ${noun} from "${row.name || "this patient"}"?`,
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
      await home2Api.deleteAppointment(row._id);
      setViewing((v) => (v && v._id === row._id ? null : v));
      await fetchAll();
      showSuccess(`${noun[0].toUpperCase()}${noun.slice(1)} deleted`);
    } catch (err) {
      Swal.fire({
        title: `Could not delete the ${noun}`,
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

  const counts = useMemo(
    () => ({
      all: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      contacted: rows.filter((r) => r.status === "contacted").length,
      confirmed: rows.filter((r) => r.status === "confirmed").length,
      cancelled: rows.filter((r) => r.status === "cancelled").length,
      today: rows.filter((r) => isSameDay(new Date(r.createdAt), new Date())).length,
      week: rows.filter((r) => isWithinLastDays(r.createdAt, 7)).length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone, r.serviceLabel, r.message].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, filtered.length);
  const paginatedRows = filtered.slice(startIndex, endIndex);
  const colCount = showEmailAndTime ? 10 : 8;
  const Noun = `${noun[0].toUpperCase()}${noun.slice(1)}`;

  const statCards: StatCardItem[] = [
    { title: `TOTAL ${noun.toUpperCase()}S`, value: counts.all, icon: Inbox, tone: "slate", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #e2e8f0 100%)", borderColor: "#e2e8f0", numColor: "#334155", footer: `View all ${noun}s`, onClick: () => changeTab("all") },
    { title: "NEW", value: counts.new, icon: Clock3, tone: "amber", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #fed7aa 100%)", borderColor: "#fed7aa", numColor: "#c2410c", footer: "View new", onClick: () => changeTab("new") },
    { title: "CONTACTED", value: counts.contacted, icon: PhoneCall, tone: "blue", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #bae6fd 100%)", borderColor: "#bae6fd", numColor: "#0284c7", footer: "View contacted", onClick: () => changeTab("contacted") },
    { title: "CONFIRMED", value: counts.confirmed, icon: CheckCircle2, tone: "emerald", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #bbf7d0 100%)", borderColor: "#bbf7d0", numColor: "#15803d", footer: "View confirmed", onClick: () => changeTab("confirmed") },
    { title: "TODAY", value: counts.today, icon: Sparkles, tone: "violet", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #ddd6fe 100%)", borderColor: "#ddd6fe", numColor: "#6d28d9", footer: "New today", onClick: () => changeTab("all") },
    { title: "LAST 7 DAYS", value: counts.week, icon: MessageSquareText, tone: "teal", gradient: "linear-gradient(135deg, #ffffff 0%, #ffffff 42%, #99f6e4 100%)", borderColor: "#99f6e4", numColor: "#0f766e", footer: "This week", onClick: () => changeTab("all") },
  ];

  const visit = (r: AppointmentRequest) => (r.consultationType === "online" ? "Online" : r.consultationType === "clinic" ? "Clinic" : "—");
  const preferred = (r: AppointmentRequest) => (r.preferredTime ? `${formatDate(r.preferredDate)} · ${r.preferredTime.split(" (")[0]}` : formatDate(r.preferredDate));

  const statusSelect = (row: AppointmentRequest, big?: boolean) => (
    <select
      value={row.status}
      disabled={updatingId === row._id}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => handleStatusChange(row._id, e.target.value as AppointmentStatus)}
      className={`cursor-pointer appearance-none rounded-[4px] font-bold outline-none bg-no-repeat shadow-xs transition disabled:opacity-50 ${
        big ? "h-[26px] px-[10px] pr-[24px] text-[9px] bg-[right_7px_center]" : "h-[18px] px-[6px] pr-[18px] text-[7px] bg-[right_5px_center]"
      } ${STATUS_STYLES[row.status]}`}
      style={{ backgroundImage: SELECT_ARROW(big ? 9 : 8) }}
    >
      {STATUS_ORDER.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );

  const HeaderIcon = icon === "consultation" ? Stethoscope : CalendarCheck;

  return (
    <div className={`${typography.pages} min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]`}>
      <div className="flex min-h-full flex-col px-[18px] pb-[16px] pt-[14px]">
        {/* HEADER */}
        <div className="mb-[14px] flex flex-wrap items-start justify-between gap-[10px] border-b-[2px] border-[#293681] pb-[10px]">
          <div>
            <h1 className="flex items-center gap-1.5 text-[19px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]">
              <HeaderIcon className="h-[17px] w-[17px]" />
              {title}
            </h1>
            <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">{subtitle}</p>
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
                placeholder={`Search by name, ${showEmailAndTime ? "email, " : ""}mobile number, service or message...`}
                className="h-[30px] w-full rounded-[5px] border border-[#e5e6e2] bg-white pl-[26px] pr-[9px] text-[9.5px] font-medium text-[#414b5e] outline-none placeholder:text-[#9aa0aa] focus:border-[#8fa98e]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="h-[26px] border-b border-[#e8e5df] bg-[#233D4D]">
                  <th className={`w-[28px] ${TH}`}>S.No</th>
                  <th className={TH}>Name</th>
                  {showEmailAndTime && <th className={TH}>Email</th>}
                  <th className={TH}>Mobile No.</th>
                  <th className={TH}>Service</th>
                  <th className={TH}>{showEmailAndTime ? "Preferred Date & Time" : "Preferred Date"}</th>
                  <th className={TH}>Visit Type</th>
                  {showEmailAndTime && <th className={TH}>Form</th>}
                  <th className={TH}>Status</th>
                  <th className={TH}>Received</th>
                  <th className={`${TH} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0ec]">
                {loading ? (
                  <tr>
                    <td colSpan={colCount + 1} className="py-12 text-center text-[10px] text-[#6c7587]">
                      Loading {noun}s…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={colCount + 1} className="py-12 text-center text-[10px] font-semibold text-red-600">
                      {loadError}
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={colCount + 1} className="py-12 text-center text-[10px] text-[#6c7587]">
                      No {noun}s match your filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rowIndex) => (
                    <tr key={row._id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-semibold text-[#6c7587]">{startIndex + rowIndex + 1}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px]">
                        <button type="button" onClick={() => openRow(row)} className="text-[8px] font-bold text-[#4B1426] hover:underline">
                          {row.name || "—"}
                        </button>
                      </td>
                      {showEmailAndTime && <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-medium text-[#334155]">{row.email || "—"}</td>}
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-bold text-[#166534]">{row.phone || "—"}</td>
                      <td className="max-w-[150px] truncate px-[8px] py-[5px] text-[8px] font-medium text-[#334155]" title={row.serviceLabel}>
                        {row.serviceLabel || "—"}
                      </td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-medium text-[#334155]">{preferred(row)}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[8px] font-medium text-[#334155]">{visit(row)}</td>
                      {showEmailAndTime && (
                        <td className="whitespace-nowrap px-[8px] py-[5px] text-[7.5px] font-medium text-[#6c7587]">{row.source === "panchakarma" ? "Panchakarma" : "Popup"}</td>
                      )}
                      <td className="whitespace-nowrap px-[8px] py-[5px]">{statusSelect(row)}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px] text-[7.5px] font-medium text-[#6c7587]">{formatDateTime(row.createdAt)}</td>
                      <td className="whitespace-nowrap px-[8px] py-[5px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="View details"
                            onClick={() => openRow(row)}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-orange-500/10 text-orange-600 backdrop-blur-md border border-orange-400/30 shadow-[0_2px_6px_rgba(249,115,22,0.12)] transition-all hover:bg-orange-500/20 hover:border-orange-400/50 hover:shadow-[0_3px_10px_rgba(249,115,22,0.25)] hover:scale-105 active:scale-95"
                          >
                            <Eye className="h-[10px] w-[10px] text-orange-600" />
                          </button>
                          {row.phone && (
                            <a
                              href={`https://wa.me/${whatsappNumber(row.phone)}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Message on WhatsApp"
                              className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px] bg-emerald-500/10 text-emerald-600 backdrop-blur-md border border-emerald-400/30 shadow-[0_2px_6px_rgba(16,185,129,0.12)] transition-all hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_3px_10px_rgba(16,185,129,0.25)] hover:scale-105 active:scale-95"
                            >
                              <Phone className="h-[10px] w-[10px] text-emerald-600" />
                            </a>
                          )}
                          <button
                            type="button"
                            title={`Delete ${noun}`}
                            onClick={() => handleDelete(row)}
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

          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[8px] text-[8px]">
              <span className="font-semibold text-[#5f6a7c]">
                Showing {startIndex + 1} to {endIndex} of {filtered.length} {noun}s
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

      {/* VIEW MODAL */}
      <Modal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        title={`${Noun} details`}
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
              {viewing.phone && (
                <a
                  href={`https://wa.me/${whatsappNumber(viewing.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-[32px] items-center gap-1.5 px-[14px] text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "#16a34a", borderRadius: "4px", boxShadow: "rgba(0,0,0,0.02) 0px 1px 3px 0px, rgba(22,163,74,0.2) 0px 0px 0px 1px" }}
                >
                  <Phone className="h-3.5 w-3.5" />
                  Reply on WhatsApp
                </a>
              )}
            </>
          )
        }
      >
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-[#18233b]">{viewing.name || "—"}</p>
                <p className="text-[10px] font-medium text-[#6c7587]">{formatDateTime(viewing.createdAt)}</p>
              </div>
              {statusSelect(viewing, true)}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Mobile Number", value: viewing.phone || "—", icon: Phone, copy: !!viewing.phone },
                { label: "Email", value: viewing.email || "—", icon: Mail, copy: !!viewing.email },
                { label: "Service", value: viewing.serviceLabel || "—", icon: Stethoscope, copy: false },
                { label: "Visit Type", value: visit(viewing) === "Online" ? "Online consultation" : visit(viewing) === "Clinic" ? "Clinic visit" : "—", icon: CalendarCheck, copy: false },
                { label: "Preferred Date", value: formatDate(viewing.preferredDate), icon: CalendarCheck, copy: false },
                { label: "Preferred Time", value: viewing.preferredTime || "—", icon: Clock3, copy: false },
                { label: "Submitted From", value: SOURCE_LABEL[viewing.source] ?? viewing.source, icon: MessageSquareText, copy: false },
                ...(viewing.source === "consultation" ? [{ label: "Agreed To Be Contacted", value: viewing.consent ? "Yes" : "No", icon: CheckCircle2, copy: false }] : []),
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

            {viewing.message && (
              <div>
                <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-[#94a3b8]">Message</p>
                <div className="rounded-[4px] border border-[#e4e7eb] bg-[#f8fafc] p-3 text-[11px] leading-relaxed text-[#334155] whitespace-pre-wrap">{viewing.message}</div>
              </div>
            )}

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
