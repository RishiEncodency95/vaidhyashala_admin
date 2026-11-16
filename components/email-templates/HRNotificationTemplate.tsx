"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  ChartColumn,
  Check,
  ChevronRight,
  Clock,
  Download,
  Globe,
  Headset,
  Mail,
  MapPin,
  Phone,
  Settings,
  Star,
  User,
  Users,
} from "lucide-react";

interface HRNotificationTemplateProps {
  roleTitle?: string;
  candidateName?: string;
  email?: string;
  phone?: string;
  location?: string;
  dob?: string;
  gender?: string;
  linkedin?: string;
  applicationId?: string;
  applicationDate?: string;
  matchScore?: number;
  cvFileName?: string;
  cvFileSize?: string;
}

// The template is drawn on a fixed 1024px canvas (same as the design), shown slightly reduced
// for a compact look and zoomed down further on narrower screens.
const CANVAS_WIDTH = 1024;
const MAX_SCALE = 0.86;
const CANVAS_HEIGHT = 1536;

const GREEN = "#0B6B44";
const DARK = "#0A3D2B";
const NAVY = "text-[#1B2A7A]";
const HEADING = "text-[#0D2E26]";
const cardClass = "absolute rounded-[10px] border border-[#E6EEE4] bg-[#F7FAF6]";

/* ---------------- Icons ---------------- */

function DocBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative w-[34px] h-[36px] shrink-0 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 40 42" fill="none" preserveAspectRatio="none">
        <path d="M5 0h25l10 10v27a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z" fill={GREEN} />
        <path d="M30 0v7a3 3 0 0 0 3 3h7L30 0z" fill="#7DB894" />
      </svg>
      <span className="relative mt-[2px]">{children}</span>
    </span>
  );
}

function CircleBadge({ children }: { children: React.ReactNode }) {
  return <span className="w-[36px] h-[36px] aspect-square rounded-full bg-[#0B6B44] flex items-center justify-center shrink-0">{children}</span>;
}

function DocLines({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 1h11l5 5v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" />
      <path d="M5 10h10M5 14h10M5 18h7" />
    </svg>
  );
}

function DocFilled({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 28" fill="none">
      <path d="M3 2a2 2 0 0 1 2-2h11l7 7v17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V2z" fill={color} />
      <path d="M16 0v5a2 2 0 0 0 2 2h5L16 0z" fill="#4DA778" />
      <path d="M6 10h9M6 14h9M6 18h6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19.5" cy="20.5" r="5.5" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M17.5 20.5l1.3 1.3 2.7-2.7" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarFilled({ className, check = false }: { className?: string; check?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="18" rx="2.5" stroke={GREEN} strokeWidth="2.2" />
      <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5V9H2V6.5z" fill={GREEN} />
      <path d="M7 1.5v5M17 1.5v5" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" />
      {check ? (
        <path d="M7 15.5l3 2.5 1.5-3.5 2 2 3.5-4" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <g fill={GREEN}>
          <rect x="5.5" y="12" width="3" height="2.6" rx=".5" />
          <rect x="10.5" y="12" width="3" height="2.6" rx=".5" />
          <rect x="15.5" y="12" width="3" height="2.6" rx=".5" />
          <rect x="5.5" y="16.5" width="3" height="2.6" rx=".5" />
          <rect x="10.5" y="16.5" width="3" height="2.6" rx=".5" />
          <rect x="15.5" y="16.5" width="3" height="2.6" rx=".5" />
        </g>
      )}
    </svg>
  );
}

function MatchCrown({ className = "w-[24px] h-[20px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 22" fill="none">
      <path d="M3 16.5C3 16.5 7 18 13 18C19 18 23 16.5 23 16.5V18.5C23 18.5 19 20 13 20C7 20 3 18.5 3 18.5V16.5Z" fill="#FFFFFF" />
      <path d="M3.5 15L5.8 7.5L9.5 11.5L13 4L16.5 11.5L20.2 7.5L22.5 15C19 16.2 7 16.2 3.5 15Z" fill="#FFFFFF" />
      <circle cx="5.8" cy="6.2" r="1.5" fill="#FFFFFF" />
      <circle cx="13" cy="3" r="1.7" fill="#FFFFFF" />
      <circle cx="20.2" cy="6.2" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

function CapFilled({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 22" fill={color}>
      <path d="M14 1L1 7.5 14 14l13-6.5L14 1z" />
      <path d="M6 11v5.5c0 2 3.6 4 8 4s8-2 8-4V11l-8 4-8-4z" />
      <path d="M4 8.5v6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4" cy="15.5" r="1.5" fill={color} />
    </svg>
  );
}

function BriefcaseFilled({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 24" fill="none">
      <path d="M10 5V3A1.5 1.5 0 0 1 11.5 1.5h5A1.5 1.5 0 0 1 18 3V5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="1" y="5" width="26" height="18" rx="3.5" fill={color} />
      <path d="M1 12.5h26" stroke="#FFFFFF" strokeWidth="1.6" />
      <rect x="12" y="10.5" width="4" height="4" rx="1" fill="#FFFFFF" />
    </svg>
  );
}

function LeafFilled({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <path d="M26 2C13 2 3 9 3 19.5c0 2.2.6 4.3 1.8 5.8C16 25 26 16.5 26 2z" fill={color} />
      <path d="M2 27C7 19.5 12.5 14.5 20 8.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PeopleFilled({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 24" fill={color}>
      <circle cx="16" cy="6" r="4.6" />
      <path d="M7.5 23v-2.5c0-4 3.8-7 8.5-7s8.5 3 8.5 7V23z" />
      <circle cx="6.5" cy="8.5" r="3.5" />
      <path d="M0 22v-1.8c0-3 2.5-5.4 6-5.4 1 0 1.8.2 2.6.5C7 17 6 19 6 21v1z" />
      <circle cx="25.5" cy="8.5" r="3.5" />
      <path d="M32 22v-1.8c0-3-2.5-5.4-6-5.4-1 0-1.8.2-2.6.5C25 17 26 19 26 21v1z" />
    </svg>
  );
}

function TargetArrow({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="16" r="9.5" strokeWidth="2.5" />
      <circle cx="12" cy="16" r="5" strokeWidth="2.5" />
      <circle cx="12" cy="16" r="1.5" fill={color} />
      <path d="M13 15L24 4" strokeWidth="2.5" />
      <path d="M18.5 4h5.5v5.5" strokeWidth="2.5" />
    </svg>
  );
}

function CalendarSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" stroke={DARK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 31H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h20a3 3 0 0 1 3 3v6" />
      <path d="M3 13h26M10 2.5v6M22 2.5v6" />
      <g fill={DARK} stroke="none">
        <rect x="7" y="16.5" width="3.4" height="3" rx=".6" />
        <rect x="13" y="16.5" width="3.4" height="3" rx=".6" />
        <rect x="7" y="22.5" width="3.4" height="3" rx=".6" />
      </g>
      <circle cx="25" cy="25" r="5.5" />
      <path d="M29 29l4.5 4.5" strokeWidth="3" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.6c-4 0-4.9 3-4.9 4.9v2H6.8v4h2.3V22.4H14V12.5h3.3l.4-4H14z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" />
    </svg>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 34 40" fill="none">
      <path d="M3 0h20l11 11v26a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z" fill="#E8262B" />
      <path d="M23 0v8a3 3 0 0 0 3 3h8L23 0z" fill="#F7A9AB" />
      <path d="M10 8c2.5 2 4 5.5 3.2 9m0 0c3.5-1 7-.2 9 1.6m-9-1.6c-1 2.8-3.4 5-5.4 5.4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      <text x="17" y="34" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#FFFFFF" fontFamily="Arial, sans-serif">PDF</text>
    </svg>
  );
}

function CheckDot({ size = 15 }: { size?: number }) {
  return (
    <span className="aspect-square rounded-full bg-[#0B8A4F] flex items-center justify-center shrink-0" style={{ width: size, height: size, minWidth: size }}>
      <Check className="text-white stroke-[3.5]" style={{ width: size * 0.62, height: size * 0.62 }} />
    </span>
  );
}

function MatchDonut({ score }: { score: number }) {
  const r = 64;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <svg className="w-[148px] h-[148px] -rotate-90" viewBox="0 0 148 148">
      <defs>
        <linearGradient id="hrDonutLight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#13A05F" />
          <stop offset="100%" stopColor="#0A8048" />
        </linearGradient>
      </defs>
      <circle cx="74" cy="74" r={r} stroke="#E4E5E6" strokeWidth="16" fill="none" />
      {/* lighter first half, darker second half – as in the design */}
      <circle cx="74" cy="74" r={r} stroke="url(#hrDonutLight)" strokeWidth="16" fill="none" strokeDasharray={`${filled * 0.5} ${c}`} />
      <circle cx="74" cy="74" r={r} stroke="#0B6B44" strokeWidth="16" fill="none" strokeDasharray={`0 ${filled * 0.5} ${filled * 0.5} ${c}`} />
    </svg>
  );
}

/* ---------------- Template ---------------- */

export default function HRNotificationTemplate({
  roleTitle = "Ayurvedic Doctor",
  candidateName = "Dr. Ananya Sharma",
  email = "ananya.sharma@gmail.com",
  phone = "+91 98765 43210",
  location = "Delhi NCR, Kalkaji Clinic",
  dob = "14 Nov 1995",
  gender = "Female",
  linkedin = "linkedin.com/in/ananya-sharma",
  applicationId = "VS-CAR-2026-00187",
  applicationDate = "17 Oct 2026, 11:24 AM",
  matchScore = 85,
  cvFileName = "Ananya_Sharma_CV.pdf",
  cvFileSize = "842 KB",
}: HRNotificationTemplateProps) {
  const [scale, setScale] = useState(MAX_SCALE);

  useEffect(() => {
    const update = () => setScale(Math.min(MAX_SCALE, document.documentElement.clientWidth / CANVAS_WIDTH));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const appDetails: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Mail className="w-[24px] h-[24px] text-[#0B6B44] stroke-[2.2]" />, label: "Application ID", value: applicationId },
    { icon: <CapFilled color={GREEN} className="w-[25px] h-[20px]" />, label: "Position Applied For", value: roleTitle },
    { icon: <CalendarFilled className="w-[24px] h-[24px]" />, label: "Application Date", value: applicationDate },
    { icon: <CapFilled color={GREEN} className="w-[25px] h-[20px]" />, label: "Application Source", value: "Vaidhyashala Careers Portal" },
  ];

  const breakdown: { icon: React.ReactNode; label: string; value: number }[] = [
    { icon: <CapFilled className="w-[28px] h-[22px]" />, label: "Educational Qualification", value: 100 },
    { icon: <PeopleFilled className="w-[30px] h-[22px]" />, label: "Patient Counselling Skills", value: 90 },
    { icon: <BriefcaseFilled className="w-[26px] h-[22px]" />, label: "Relevant Experience", value: 85 },
    { icon: <DocFilled className="w-[24px] h-[26px]" />, label: "Documentation", value: 75 },
    { icon: <LeafFilled className="w-[26px] h-[26px]" />, label: "Panchakarma Knowledge", value: 80 },
    { icon: <TargetArrow className="w-[26px] h-[26px]" />, label: "Role Fit", value: 80 },
  ];

  const highlights = [
    "BAMS / MD (Ayurveda) qualified",
    "2+ years of relevant clinical experience",
    "Experience in Panchakarma therapies and Ayurvedic consultation",
    "Good communication and patient counselling skills",
    "Familiar with medical documentation and record keeping",
    "Willing to work from Delhi NCR",
  ];

  const nextSteps: { icon: React.ReactNode; title: string; desc: string; left: number; width: number; descWidth: number }[] = [
    { icon: <CalendarSearch className="w-[27px] h-[27px]" />, title: "Review Application", desc: "Go through the candidate's profile, CV and AI analysis in detail.", left: 15, width: 215, descWidth: 190 },
    { icon: <Users className="w-[28px] h-[28px] text-[#0A3D2B] stroke-[2]" />, title: "Shortlisting Decision", desc: "Mark as shortlisted or not shortlisted in the recruitment system.", left: 270, width: 193, descWidth: 152 },
    { icon: <CalendarFilled className="w-[26px] h-[26px]" />, title: "Schedule Interview", desc: "If shortlisted, coordinate for initial interview (phone / video / in-person).", left: 503, width: 202, descWidth: 172 },
    { icon: <Mail className="w-[28px] h-[28px] text-[#0A3D2B] stroke-[2]" />, title: "Update Candidate", desc: "Share the status with the candidate via email through the system.", left: 744, width: 202, descWidth: 152 },
  ];

  const notes = [
    "The AI screening score is a preliminary assessment and does not guarantee selection.",
    "Final shortlisting and recruitment decisions are to be made by the HR team.",
    "Please verify the candidate's qualifications, experience and documents as per company policy.",
    "Keep the candidate updated through the recruitment system.",
  ];

  return (
    <div className={`font-sans min-h-screen w-full bg-[#EEF2EC] overflow-x-hidden py-4`}>
      <div className="mx-auto" style={{ width: CANVAS_WIDTH, zoom: scale }}>
        <div
          className="relative overflow-hidden bg-[#FEFEFC] shadow-[0_10px_40px_rgba(10,47,45,0.10)]"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {/* ============ TOP (banner, quote card & leaves come from the artwork) ============ */}
          <Image src="/email-assets/hr/hr_banner_clean.webp" alt="Vaidhyashala - Together for a Healthier Tomorrow" width={1024} height={388} priority unoptimized className="absolute left-0 top-0 w-[1024px] h-[388px]" />

          {/* Brand logo stacked (emblem above wordmark) as in the design */}
          <Image src="/email-assets/hr/logo_icon.webp" alt="" width={460} height={373} priority unoptimized className="absolute left-[183px] top-[12px] w-[94px] h-auto" />
          <Image src="/email-assets/hr/logo_word.webp" alt="Vaidhyashala - Innovative Healing" width={1110} height={363} priority unoptimized className="absolute left-[130px] top-[70px] w-[200px] h-auto" />

          <span className="absolute left-[51px] top-[160px] w-[203px] h-[40px] rounded-[5px] bg-[#0B6B44] flex items-center gap-[12px] pl-[13px] text-[16px] font-medium text-white tracking-[0.01em]">
            <Mail className="w-[20px] h-[20px] stroke-[1.8]" />
            HR NOTIFICATION
          </span>

          <h1 className={`${HEADING}  absolute left-[51px] top-[204px] flex items-center gap-[14px] text-[39.5px] font-bold leading-none tracking-[-0.01em] whitespace-nowrap`}>
            New Application Received
            <Image src="/email-assets/career/leaf.webp" alt="" width={40} height={40} unoptimized className="w-[44px] h-[44px] -rotate-[8deg]" />
          </h1>
          <p className="absolute left-[52px] top-[256px] text-[22px] leading-none text-[#183649] whitespace-nowrap">
            Candidate Details, AI Screening Result &amp; Recommendation
          </p>
          <p className={`absolute left-[52px] top-[293px] text-[17.5px] font-bold leading-none ${NAVY}`}>Dear HR Team,</p>
          <p className={`absolute left-[52px] top-[318px] w-[720px] text-[15.5px] leading-[19.6px] ${NAVY}`}>
            We have received a new application for the position of <strong className="font-bold">{roleTitle}</strong> at{" "}
            <strong className="font-bold">Vaidhyashala</strong>.
            <br />
            Please find below the candidate&apos;s profile, AI screening result and analysis. Kindly review the details
            <br />
            and take the next steps as per the recruitment process.
          </p>

          {/* ============ CANDIDATE PROFILE ============ */}
          <section className={cardClass} style={{ left: 35, top: 390, width: 489, height: 245 }}>
            <div className="absolute left-[11px] top-[4px] flex items-center gap-[13px]">
              <DocBadge>
                <User className="w-[19px] h-[19px] text-white fill-white" />
              </DocBadge>
              <h2 className={`${HEADING}   text-[20.3px] font-bold`}>Candidate Profile</h2>
            </div>
            <div className="absolute left-[10px] right-[6px] top-[42px] bottom-[8px] rounded-[8px] bg-white/80">
              <div className="absolute left-[7px] top-[4px] w-[165px] h-[184px] rounded-[7px] overflow-hidden bg-[#EDF2EE]">
                <Image src="/email-assets/hr/avatar.webp" alt={candidateName} fill unoptimized className="object-cover" />
              </div>
              <h3 className={`${HEADING}   absolute left-[198px] top-[6px] text-[22px] font-bold leading-none whitespace-nowrap`}>
                {candidateName}
              </h3>
              <ul className={`absolute left-[198px] top-[36px] text-[15px] ${NAVY}`}>
                <li className="h-[31px] flex items-center gap-[20px]">
                  <Mail className="w-[22px] h-[22px] text-[#0B6B44] stroke-[2.2]" />
                  <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                </li>
                <li className="h-[31px] flex items-center gap-[20px]">
                  <Phone className="w-[22px] h-[22px] text-[#0B6B44] fill-[#0B6B44]" />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:underline">{phone}</a>
                </li>
                <li className="h-[31px] flex items-center gap-[20px]">
                  <MapPin className="w-[22px] h-[22px] text-[#0B6B44] fill-[#0B6B44] [&>circle]:fill-white" />
                  {location}
                </li>
                <li className="h-[31px] flex items-center gap-[20px]">
                  <CalendarFilled check className="w-[22px] h-[22px]" />
                  <span>
                    {dob}
                    <span className="px-[12px]">|</span>
                    {gender}
                  </span>
                </li>
                <li className="h-[31px] flex items-center gap-[20px]">
                  <span className="w-[22px] h-[22px] rounded-[4px] bg-[#1D7FE0] flex items-center justify-center">
                    <LinkedinIcon className="w-[14px] h-[14px] text-white" />
                  </span>
                  <a href={`https://${linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{linkedin}</a>
                </li>
              </ul>
            </div>
          </section>

          {/* ============ APPLICATION DETAILS ============ */}
          <section className={cardClass} style={{ left: 530, top: 390, width: 465, height: 245 }}>
            <div className="absolute left-[14px] top-[4px] flex items-center gap-[14px]">
              <DocBadge>
                <DocLines className="w-[14px] h-[17px]" />
              </DocBadge>
              <h2 className={`${HEADING}   text-[18px] font-bold`}>Application Details</h2>
            </div>
            <div className="absolute left-[10px] right-[8px] top-[42px] bottom-[8px] rounded-[8px] bg-white/80 pl-[23px] pr-[10px]">
              {appDetails.map(({ icon, label, value }) => (
                <div key={label} className="relative h-[36px] flex items-center">
                  <span className="w-[24px] flex justify-center">{icon}</span>
                  <span className="absolute left-[46px] right-0 bottom-0 h-px bg-[#E8ECE9]" />
                  <span className="ml-[22px] w-[150px] text-[14px] text-[#3B4C78]">{label}</span>
                  <span className={`text-[14.5px] font-bold ${NAVY}`}>{value}</span>
                </div>
              ))}
              <div className="h-[44px] flex items-center">
                <span className="w-[24px] flex justify-center">
                  <Clock className="w-[25px] h-[25px] text-[#0B6B44] stroke-[2.3]" />
                </span>
                <span className="ml-[22px] w-[146px] text-[14px] text-[#3B4C78]">Application Status</span>
                <span className="h-[30px] px-[13px] rounded-[5px] bg-[#E2F0DC] flex items-center text-[14.5px] font-medium text-[#0D2E26]">
                  Received – Under HR Review
                </span>
              </div>
            </div>
          </section>

          {/* ============ AI SCREENING RESULT ============ */}
          <section className={cardClass} style={{ left: 35, top: 643, width: 480, height: 225 }}>
            <div className="absolute left-[10px] top-[4px] flex items-start gap-[18px]">
              <CircleBadge>
                <ChartColumn className="w-[19px] h-[19px] text-white stroke-[3]" />
              </CircleBadge>
              <div className="pt-[6px]">
                <h2 className={`${HEADING}   text-[20.4px] font-bold leading-none`}>AI Screening Result</h2>
                <p className="mt-[8px] text-[10.6px] leading-none text-[#22307A] whitespace-nowrap">
                  Here is the candidate&apos;s profile match and analysis based on the job requirements.
                </p>
              </div>
            </div>

            <div className="absolute left-[24px] top-[64px] w-[148px] h-[148px]">
              <MatchDonut score={matchScore} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[40px] font-bold leading-none ${NAVY}`}>{matchScore}%</span>
                <span className={`mt-[6px] text-[14.5px] leading-none ${NAVY}`}>Match Score</span>
              </div>
            </div>

            <div className="absolute left-[198px] top-[70px] w-[264px] h-[145px] rounded-[8px] bg-[#EEF5EC]">
              <span className="absolute left-[14px] top-[14px] w-[34px] h-[34px] rounded-full bg-[#0B8A4F] flex items-center justify-center">
                <Check className="w-[22px] h-[22px] text-white stroke-[3.2]" />
              </span>
              <h3 className={`${HEADING}   absolute left-[57px] top-[19px] text-[19px] font-bold leading-none whitespace-nowrap`}>
                Eligible to Apply
              </h3>
              <p className="absolute left-[57px] right-[8px] top-[55px] text-[14px] leading-[17.6px] text-[#55626A]">
                The candidate&apos;s profile matches well with the job requirements and qualifications derived from the job description.
              </p>
            </div>
          </section>

          {/* ============ MATCH BREAKDOWN ============ */}
          <section className="absolute rounded-[10px] border border-[#E5ECE2] bg-white" style={{ left: 520, top: 643, width: 475, height: 225 }}>
            <div className="absolute left-[16px] top-[14px] flex items-center gap-[12px]">
              <span className="w-[42px] h-[42px] rounded-full bg-[#0B6B44] flex items-center justify-center shrink-0">
                <MatchCrown className="w-[25px] h-[21px]" />
              </span>
              <div>
                <h2 className="font-serif text-[21.5px] font-bold text-[#0D3226] leading-none tracking-[-0.01em]">
                  Match Breakdown
                </h2>
                <p className="font-sans mt-[5px] text-[12px] font-medium text-[#486382] leading-none whitespace-nowrap">
                  Here&apos;s how the candidate&apos;s profile aligns with the key requirements:
                </p>
              </div>
            </div>

            {breakdown.map(({ icon, label, value }, idx) => {
              const col = idx % 2;
              const row = Math.floor(idx / 2);
              const left = col === 0 ? 16 : 246;
              const top = 72 + row * 49;
              return (
                <div key={label} className="absolute flex items-center gap-[10px]" style={{ left, top, width: 216 }}>
                  <span className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
                    {icon}
                  </span>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <p className="font-sans text-[12.2px] font-medium text-[#35537C] leading-none truncate mb-[5px]">
                      {label}
                    </p>
                    <div className="flex items-center gap-[8px]">
                      <div className="flex-1 h-[11px] rounded-full bg-[#E5E9E6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#006B3E] via-[#028E50] to-[#0CB668]"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="w-[36px] text-right text-[13.5px] font-bold text-[#0B6B44] leading-none shrink-0">
                        {value}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* ============ KEY HIGHLIGHTS ============ */}
          <section className={cardClass} style={{ left: 35, top: 877, width: 480, height: 230 }}>
            <div className="absolute left-[11px] top-[2px] flex items-center gap-[16px]">
              <DocBadge>
                <DocLines className="w-[14px] h-[17px]" />
              </DocBadge>
              <h2 className={`${HEADING}   text-[18.3px] font-bold whitespace-nowrap`}>
                Key Highlights <span className="font-normal text-[14.3px]">(from CV &amp; AI Analysis)</span>
              </h2>
            </div>
            <ul className="absolute left-[12px] right-[10px] top-[44px] bottom-[12px] rounded-[8px] bg-[#F3F8F2] pl-[15px] pt-[7px]">
              {highlights.map((item) => (
                <li key={item} className="h-[23.4px] flex items-center gap-[13px] text-[14px] text-[#22307A] whitespace-nowrap">
                  <CheckDot size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* ============ RESUME & DOCUMENTS + AI RECOMMENDATION ============ */}
          <section className={cardClass} style={{ left: 522, top: 877, width: 473, height: 230 }}>
            <div className="absolute left-[15px] top-[2px] flex items-center gap-[15px]">
              <DocBadge>
                <DocLines className="w-[14px] h-[17px]" />
              </DocBadge>
              <h2 className={`${HEADING}   text-[17px] font-bold`}>Resume &amp; Documents</h2>
            </div>

            <div className="absolute left-[16px] right-[9px] top-[43px] h-[58px] rounded-[8px] bg-white">
              <PdfIcon className="absolute left-[25px] top-[9px] w-[31px] h-[37px]" />
              <p className={`absolute left-[78px] top-[12px] text-[14.5px] font-bold leading-none ${NAVY}`}>{cvFileName}</p>
              <p className="absolute left-[78px] top-[33px] text-[11.5px] leading-none text-[#3B4C78]">
                {cvFileSize}
                <span className="px-[9px]">|</span>
                {applicationDate}
              </p>
              <a
                href="#"
                download={cvFileName}
                className="absolute right-[8px] top-[9px] w-[152px] h-[40px] rounded-[5px] bg-[#0B6B44] hover:bg-[#08583A] flex items-center justify-center gap-[13px] text-[14.5px] font-medium text-white shadow-[0_2px_6px_rgba(11,107,68,0.25)] transition-colors"
              >
                <Download className="w-[21px] h-[21px] stroke-[2.2]" />
                Download CV
              </a>
            </div>

            <div className="absolute left-[17px] top-[107px] flex items-center gap-[14px]">
              <Star className="w-[24px] h-[24px] text-[#F7A21B] fill-[#F7A21B]" />
              <h3 className={`${HEADING}   text-[17.2px] font-bold`}>AI Recommendation</h3>
            </div>

            <div className="absolute left-[16px] right-[9px] top-[140px] bottom-[7px] rounded-[8px] bg-[#EEF5EC]">
              <span className="absolute left-[10px] top-[11px] w-[60px] h-[60px] rounded-full bg-white/90 flex items-center justify-center">
                <PeopleFilled color={GREEN} className="w-[38px] h-[29px]" />
              </span>
              <h4 className={`${HEADING}   absolute left-[86px] top-[7px] text-[17px] font-bold`}>Strong Match</h4>
              <p className="absolute left-[86px] right-[12px] top-[30px] text-[12.8px] leading-[16px] text-[#3B4C78]">
                The candidate is recommended to move to the next stage of evaluation based on skills, experience and qualifications.
                Final decision to be taken by HR after detailed review.
              </p>
            </div>
          </section>

          {/* ============ SUGGESTED NEXT STEPS ============ */}
          <section className={cardClass} style={{ left: 35, top: 1115, width: 960, height: 172 }}>
            <div className="absolute left-[12px] top-[3px] flex items-center gap-[13px]">
              <Settings className="w-[26px] h-[26px] text-[#0A3D2B] fill-[#0A3D2B] stroke-[2] [&>circle]:fill-white" />
              <h2 className={`${HEADING}   text-[18.3px] font-bold`}>Suggested Next Steps for HR</h2>
            </div>

            {nextSteps.map(({ icon, title, desc, left, width, descWidth }, idx) => (
              <React.Fragment key={title}>
                <div className="absolute top-[38px] h-[127px] rounded-[8px] bg-[#F0F5EE]" style={{ left, width }}>
                  <span className="absolute left-[13px] top-[8px] w-[28px] h-[28px] rounded-full bg-[#0B8A4F] flex items-center justify-center text-white text-[15px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="absolute left-[56px] top-[6px] w-[32px] h-[32px] flex items-center justify-center">{icon}</span>
                  <h3 className={`${HEADING}   absolute left-[21px] top-[47px] text-[15px] font-bold leading-none whitespace-nowrap`}>
                    {title}
                  </h3>
                  <p className="absolute left-[21px] top-[67px] text-[14px] leading-[17px] text-[#55626A]" style={{ width: descWidth }}>{desc}</p>
                </div>
                {idx < nextSteps.length - 1 && (
                  <ChevronRight
                    className="absolute top-[93px] w-[18px] h-[18px] text-[#0A3D2B] stroke-[2.6]"
                    style={{ left: [239, 472, 714][idx] }}
                  />
                )}
              </React.Fragment>
            ))}
          </section>

          {/* ============ IMPORTANT NOTE ============ */}
          <section className="absolute rounded-[10px] border border-[#E1EAF6] bg-[#EDF5FE]" style={{ left: 35, top: 1293, width: 566, height: 126 }}>
            <span className={`absolute left-[12px] top-[6px] w-[22px] h-[22px] rounded-full bg-[#1F7BEA] flex items-center justify-center text-white font-bold text-[14px]`}>
              i
            </span>
            <h2 className={`absolute left-[48px] top-[7px] text-[16.3px] font-bold leading-none ${NAVY}`}>Important Note</h2>
            <ul className="absolute left-[47px] top-[28px]">
              {notes.map((note) => (
                <li key={note} className="h-[22.5px] flex items-center gap-[9px] text-[11.5px] text-[#22307A] whitespace-nowrap">
                  <CheckDot />
                  {note}
                </li>
              ))}
            </ul>
          </section>

          {/* ============ NEED ANY ASSISTANCE ============ */}
          <section className="absolute rounded-[10px] border border-[#E9EDEA] bg-white" style={{ left: 610, top: 1293, width: 385, height: 126 }}>
            <span className="absolute left-[10px] top-[8px] w-[42px] h-[42px] rounded-full bg-[#0B5A3A] flex items-center justify-center">
              <Headset className="w-[22px] h-[22px] text-white stroke-[2]" />
            </span>
            <h2 className={`${HEADING}   absolute left-[75px] top-[7px] text-[15.5px] font-bold leading-none`}>Need Any Assistance?</h2>
            <p className="absolute left-[75px] right-[28px] top-[27px] text-[12.5px] leading-[15px] text-[#3B4C78]">
              If you need any further information or have queries regarding this application, please feel free to reach out to the
              recruitment team.
            </p>
            <a href="mailto:careers@vaidhyashala.com" className={`absolute left-[76px] top-[80px] flex items-center gap-[17px] text-[13px] leading-none hover:underline ${NAVY}`}>
              <Mail className="w-[16px] h-[16px] text-white fill-[#0A3D2B] stroke-[1.6]" />
              careers@vaidhyashala.com
            </a>
            <a href="tel:+919876543210" className={`absolute left-[76px] top-[102px] flex items-center gap-[17px] text-[13px] leading-none hover:underline ${NAVY}`}>
              <Phone className="w-[15px] h-[15px] text-[#0A3D2B] fill-[#0A3D2B]" />
              +91 98765 43210&nbsp; (Mon – Fri, 10 AM – 6 PM)
            </a>
          </section>

          {/* ============ FOOTER ============ */}
          <Image src="/email-assets/hr/leaf_bl.webp" alt="" width={75} height={117} unoptimized className="absolute left-0 bottom-0 w-[75px] h-[117px] pointer-events-none select-none" />
          <Image src="/email-assets/hr/leaf_br.webp" alt="" width={69} height={117} unoptimized className="absolute right-0 bottom-0 w-[69px] h-[117px] pointer-events-none select-none" />

          <footer className="absolute left-[33px] top-[1425px] w-[958px] h-[92px] rounded-t-[34px] bg-[#013528]">
            <span className="absolute left-[28px] top-[14px] w-[278px] h-[64px] rounded-[10px] bg-white flex items-center justify-center">
              <Image src="/email-assets/lo.webp" alt="Vaidhyashala - Innovative Healing" width={1600} height={373} unoptimized className="w-[250px] h-auto" />
            </span>
            <span className="absolute left-[327px] top-[15px] h-[64px] w-px bg-white/40" />
            <ul className="absolute left-[355px] top-[13px] text-[13.5px] leading-none text-white">
              <li className="h-[24px] flex items-center">
                <a href="https://www.vaidhyashala.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-[14px] hover:underline">
                  <Globe className="w-[15px] h-[15px]" />
                  www.vaidhyashala.com
                </a>
              </li>
              <li className="h-[24px] flex items-center">
                <a href="mailto:careers@vaidhyashala.com" className="flex items-center gap-[14px] hover:underline">
                  <Mail className="w-[15px] h-[15px]" />
                  careers@vaidhyashala.com
                </a>
              </li>
              <li className="h-[24px] flex items-center gap-[14px]">
                <MapPin className="w-[15px] h-[15px] fill-white [&>circle]:fill-[#013528]" />
                Vaidhyashala Clinic, Kalkaji, New Delhi – 110019
              </li>
            </ul>

            <div className="absolute left-[742px] top-[19px] flex items-center gap-[9px]">
              {[
                { label: "LinkedIn", Icon: LinkedinIcon },
                { label: "Instagram", Icon: InstagramIcon },
                { label: "Facebook", Icon: FacebookIcon },
                { label: "YouTube", Icon: YoutubeIcon },
              ].map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-[30px] h-[30px] aspect-square rounded-full bg-white flex items-center justify-center text-[#013528] hover:bg-[#E2F0DC] transition-colors"
                >
                  <Icon className="w-[15px] h-[15px]" />
                </a>
              ))}
            </div>
            <p className={`absolute left-[723px] top-[64px] text-[13.4px] italic leading-none text-white whitespace-nowrap`}>
              Healing People | Enriching Lives
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
