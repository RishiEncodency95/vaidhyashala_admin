"use client";

import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Search, Trash2 } from "lucide-react";
import Table, { Column } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { errorMessage, showError } from "@/components/cms-home/shared";
import { home2Api, AppointmentRequest, AppointmentSource, AppointmentStatus } from "@/lib/home2Api";

const SOURCES: { value: AppointmentSource | ""; label: string }[] = [
  { value: "", label: "All forms" },
  { value: "home2", label: "Home · Plan your first visit" },
  { value: "consultation", label: "Plan your consultation popup" },
  { value: "panchakarma", label: "Panchakarma · Request a consultation" },
];
const SOURCE_LABEL: Record<AppointmentSource, string> = {
  home2: "Home appointment",
  consultation: "Consultation popup",
  panchakarma: "Panchakarma",
};
const STATUSES: AppointmentStatus[] = ["new", "contacted", "confirmed", "cancelled"];
const STATUS_TONE: Record<AppointmentStatus, "pending" | "progress" | "success" | "danger"> = {
  new: "pending",
  contacted: "progress",
  confirmed: "success",
  cancelled: "danger",
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AppointmentRequestsPage() {
  const [items, setItems] = useState<AppointmentRequest[]>([]);
  const [counts, setCounts] = useState<Partial<Record<AppointmentStatus, number>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [source, setSource] = useState<AppointmentSource | "">("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [selected, setSelected] = useState<AppointmentRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState<AppointmentStatus>("new");
  const [draftNote, setDraftNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Search runs shortly after typing stops
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await home2Api.listAppointments({ source, status, q: query, limit: 100 });
      setItems(res.items);
      setCounts(res.counts);
      setLoadError("");
    } catch (err) {
      setLoadError(errorMessage(err, "Could not load the requests."));
    } finally {
      setLoading(false);
    }
  }, [source, status, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on filter change
    load();
  }, [load]);

  const open = (row: AppointmentRequest) => {
    setSelected(row);
    setDraftStatus(row.status);
    setDraftNote(row.adminNote ?? "");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await home2Api.updateAppointment(selected._id, { status: draftStatus, adminNote: draftNote.trim() });
      setSelected(null);
      await load();
    } catch (err) {
      showError(errorMessage(err, "Could not update this request."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    const ok = await Swal.fire({
      title: "Delete this request?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!ok.isConfirmed) return;
    try {
      await home2Api.deleteAppointment(selected._id);
      setSelected(null);
      await load();
    } catch (err) {
      showError(errorMessage(err, "Could not delete this request."));
    }
  };

  const columns: Column<AppointmentRequest>[] = [
    { key: "createdAt", header: "Received", render: (r) => <span className="whitespace-nowrap">{formatDateTime(r.createdAt)}</span> },
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-text-primary">{r.name || "—"}</span> },
    { key: "phone", header: "Mobile", render: (r) => r.phone || "—" },
    { key: "service", header: "Service", render: (r) => r.serviceLabel || "—" },
    {
      key: "preferred",
      header: "Preferred",
      render: (r) => (
        <span className="whitespace-nowrap">
          {formatDate(r.preferredDate)}
          {r.preferredTime ? ` · ${r.preferredTime.split(" (")[0]}` : ""}
        </span>
      ),
    },
    { key: "type", header: "Visit", render: (r) => (r.consultationType === "online" ? "Online" : r.consultationType === "clinic" ? "Clinic" : "—") },
    { key: "source", header: "Form", render: (r) => SOURCE_LABEL[r.source] ?? r.source },
    { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
  ];

  const field = (label: string, value?: string | null) => (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-0.5 break-words text-sm text-text-primary">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Appointment Requests</h1>
        <p className="text-xs text-text-muted">
          Everything patients submit through the website&apos;s appointment and consultation forms.
        </p>
      </div>

      {/* Status counts: click to filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus("")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${status === "" ? "border-accent bg-accent text-white" : "border-surface-border bg-surface-card text-text-secondary hover:bg-surface-sunken"}`}
        >
          All · {Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)}
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(status === s ? "" : s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? "border-accent bg-accent text-white" : "border-surface-border bg-surface-card text-text-secondary hover:bg-surface-sunken"}`}
          >
            {s} · {counts[s] ?? 0}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as AppointmentSource | "")}
          className="h-9 rounded-lg border border-surface-border bg-surface-card px-3 text-sm text-text-primary"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, mobile, email or service"
            className="h-9 w-full rounded-lg border border-surface-border bg-surface-card pl-9 pr-3 text-sm text-text-primary"
          />
        </div>
      </div>

      {loadError && <p className="text-sm font-medium text-red-600">{loadError}</p>}

      <Table<AppointmentRequest>
        columns={columns}
        rows={items}
        rowKey={(r) => r._id}
        loading={loading}
        onRowClick={open}
        emptyMessage="No requests yet."
      />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Request details"
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" size="sm" onClick={remove} className="text-red-600 hover:bg-red-50 hover:text-red-700">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button size="sm" onClick={save} loading={saving}>
                Save
              </Button>
            </div>
          </div>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field("Name", selected.name)}
              {field("Mobile", selected.phone)}
              {field("Email", selected.email)}
              {field("Submitted from", SOURCE_LABEL[selected.source] ?? selected.source)}
              {field("Service", selected.serviceLabel)}
              {field("Visit type", selected.consultationType === "online" ? "Online consultation" : selected.consultationType === "clinic" ? "Clinic visit" : "")}
              {field("Preferred date", selected.preferredDate ? formatDate(selected.preferredDate) : "")}
              {field("Preferred time", selected.preferredTime)}
              {field("Received", formatDateTime(selected.createdAt))}
              {selected.source === "consultation" && field("Agreed to be contacted", selected.consent ? "Yes" : "No")}
            </div>
            {field("Message", selected.message)}

            <div className="grid grid-cols-1 gap-4 border-t border-surface-border pt-4 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Status</p>
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as AppointmentStatus)}
                  className="mt-1 h-9 w-full rounded-lg border border-surface-border bg-surface-card px-3 text-sm capitalize text-text-primary"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Internal note" rows={3} value={draftNote} onChange={(e) => setDraftNote(e.target.value)} maxLength={1000} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
