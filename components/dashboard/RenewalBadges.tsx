"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Globe2, Server, type LucideIcon } from "lucide-react";
import { externalServiceApi } from "@/lib/externalServiceApi";
import { daysRemaining } from "@/lib/systemServiceUtils";
import type { ExternalService } from "@/lib/types";

/** A service is "urgent" once it is inside its last two weeks (same as the Topbar). */
const URGENT_DAYS = 14;

const TONES = {
  expired: { card: "border-[#F5B5B5] bg-[#FFF5F5] hover:border-[#EE8F8F]", icon: "border-[#F5B5B5] text-[#E5484D]", text: "text-[#E5484D]" },
  urgent: { card: "border-[#F7D7A1] bg-[#FFFAF0] hover:border-[#F0BE6A]", icon: "border-[#F7D7A1] text-[#D97706]", text: "text-[#D97706]" },
  ok: { card: "border-[#BFE3CC] bg-[#F4FBF6] hover:border-[#93CDA8]", icon: "border-[#BFE3CC] text-[#15803D]", text: "text-[#15803D]" },
  none: { card: "border-slate-200 bg-white hover:border-slate-300", icon: "border-slate-200 text-slate-400", text: "text-slate-400" },
};

function RenewalBadge({ label, icon: Icon, service, onClick }: { label: string; icon: LucideIcon; service?: ExternalService; onClick: () => void }) {
  const days = service ? daysRemaining(service.expiryDate) : null;
  const state = days === null ? "none" : days < 0 ? "expired" : days <= URGENT_DAYS ? "urgent" : "ok";
  const tone = TONES[state];
  const count = days === null ? "--" : String(Math.max(days, 0)).padStart(2, "0");
  const status = state === "none" ? "Not set" : state === "expired" ? "Expired" : days === 1 ? "Day left" : "Days left";

  return (
    <button
      type="button"
      onClick={onClick}
      title={service ? `${service.name} — renews ${new Date(service.expiryDate).toLocaleDateString()}` : `Add your ${label.toLowerCase()} in System Services`}
      className={`flex h-[44px] items-center gap-2.5 rounded-[6px] border pl-2 pr-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-colors ${tone.card}`}
    >
      <span className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[6px] border bg-white ${tone.icon}`}>
        <Icon className="h-[17px] w-[17px] stroke-[2]" />
      </span>
      <span className="whitespace-nowrap text-[13.5px] font-medium text-[#1E293B]">{label}</span>
      <span className={`font-mono text-[17px] leading-none tabular-nums ${tone.text}`}>{count}</span>
      <span className={`whitespace-nowrap text-[13.5px] font-semibold ${tone.text}`}>{status}</span>
      <ChevronRight className="ml-1.5 h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}

/** Domain & hosting renewal status from System Services, shown beside the Dashboard title. */
export default function RenewalBadges() {
  const router = useRouter();
  const [services, setServices] = useState<ExternalService[]>([]);

  useEffect(() => {
    externalServiceApi
      .summary()
      .then(setServices)
      .catch(() => setServices([]));
  }, []);

  const soonest = (category: ExternalService["category"]) =>
    services
      .filter((s) => s.category === category)
      .sort((a, b) => daysRemaining(a.expiryDate) - daysRemaining(b.expiryDate))[0];

  // Same as the Topbar: System Services asks for access again each visit
  const goToServices = () => {
    sessionStorage.removeItem("moksha_system_services_grant");
    sessionStorage.removeItem("moksha_system_services_expires_at");
    sessionStorage.removeItem("bharat_organic_system_services_grant");
    router.push("/system-services");
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <RenewalBadge label="Domain Renewal" icon={Globe2} service={soonest("DOMAIN")} onClick={goToServices} />
      <RenewalBadge label="Hosting Renewal" icon={Server} service={soonest("HOSTING")} onClick={goToServices} />
    </div>
  );
}
