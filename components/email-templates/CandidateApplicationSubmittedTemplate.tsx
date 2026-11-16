"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Check, ChevronRight, Clock, Globe, Mail, MapPin, Phone, Settings } from "lucide-react";

interface CandidateApplicationSubmittedTemplateProps {
  roleTitle?: string;
  candidateName?: string;
  applicationId?: string;
  applicationDate?: string;
  preferredLocation?: string;
  matchScore?: number;
}

// Drawn on the design's fixed 1024 x 1536 canvas, shown slightly reduced and zoomed down on narrow screens.
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 1536;
const MAX_SCALE = 0.86;

const GREEN = "#0B6B44";
const DARK = "#0A3D2B";
const NAVY = "text-[#1B2A7A]";
const HEADING = "text-[#0D2E26]";
const cardClass = "absolute rounded-[10px] border border-[#E3ECE1] bg-[#F5F9F3]";

/* ---------------- Icons ---------------- */

function DocBadge() {
  return (
    <svg className="w-[32px] h-[34px]" viewBox="0 0 40 42" fill="none">
      <path d="M5 0h25l10 10v27a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z" fill={GREEN} />
      <path d="M30 0v7a3 3 0 0 0 3 3h7L30 0z" fill="#7DB894" />
      <path d="M10 17h20M10 23.5h20M10 30h14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IdCard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 26 22" fill="none" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round">
      <rect x="1.5" y="3" width="23" height="17" rx="2.5" />
      <path d="M9 1v4M17 1v4" />
      <circle cx="8.5" cy="11" r="2.4" fill={GREEN} stroke="none" />
      <path d="M4.5 17c.6-2 2.2-3 4-3s3.4 1 4 3" />
      <path d="M15 10h6M15 14h5" />
    </svg>
  );
}

function BriefcaseFilled({ className, color = DARK }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 24" fill="none">
      <path d="M10 5V3.5A1.5 1.5 0 0 1 11.5 2h5A1.5 1.5 0 0 1 18 3.5V5" stroke={color} strokeWidth="2.2" />
      <rect x="1" y="5" width="26" height="18" rx="3" fill={color} />
      <path d="M1 12.5h26" stroke="#FFFFFF" strokeWidth="1.6" />
      <rect x="12" y="10.5" width="4" height="4" rx="1" fill="#FFFFFF" />
    </svg>
  );
}

function CalendarFilled({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="18" rx="2.5" stroke={color} strokeWidth="2.2" />
      <path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5V9H2V6.5z" fill={color} />
      <path d="M7 1.5v5M17 1.5v5" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <g fill={color}>
        <rect x="5.5" y="12" width="3" height="2.6" rx=".5" />
        <rect x="10.5" y="12" width="3" height="2.6" rx=".5" />
        <rect x="15.5" y="12" width="3" height="2.6" rx=".5" />
        <rect x="5.5" y="16.5" width="3" height="2.6" rx=".5" />
        <rect x="10.5" y="16.5" width="3" height="2.6" rx=".5" />
        <rect x="15.5" y="16.5" width="3" height="2.6" rx=".5" />
      </g>
    </svg>
  );
}

function CapFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 22" fill={DARK}>
      <path d="M14 1L1 7.5 14 14l13-6.5L14 1z" />
      <path d="M6 11v5.5c0 2 3.6 4 8 4s8-2 8-4V11l-8 4-8-4z" />
      <path d="M25 8.5v6.5" stroke={DARK} strokeWidth="1.6" />
      <circle cx="25" cy="15.5" r="1.4" />
    </svg>
  );
}

function PeopleFilled({ className, color = DARK }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 24" fill={color}>
      <circle cx="11" cy="6" r="4.6" />
      <path d="M2 23v-2.5c0-4 3.8-7 9-7s9 3 9 7V23z" />
      <circle cx="23" cy="7.5" r="3.8" />
      <path d="M32 22v-1.8c0-3.4-2.9-6-7-6-1.2 0-2.3.2-3.3.6C23.7 16.6 25 18.9 25 21.5v.5z" />
    </svg>
  );
}

function PeopleOutline({ className, color = GREEN }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 26" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <circle cx="16" cy="7" r="4" />
      <path d="M8.5 24v-2c0-3.7 3.3-6.5 7.5-6.5s7.5 2.8 7.5 6.5v2" />
      <circle cx="6.5" cy="10" r="3" />
      <path d="M1.5 23v-1.5c0-2.7 2.2-4.7 5-4.7" />
      <circle cx="25.5" cy="10" r="3" />
      <path d="M30.5 23v-1.5c0-2.7-2.2-4.7-5-4.7" />
    </svg>
  );
}

function DocFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 30" fill="none">
      <path d="M3 0h12l9 9v18a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3z" fill={DARK} />
      <path d="M15 0v6a3 3 0 0 0 3 3h6L15 0z" fill="#5E8F78" />
      <path d="M5 14h11M5 18.5h13M5 23h8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LeafFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <path d="M25 2C12 2 3 9 3 19c0 2 .5 4 1.5 5.5C15 24 25 16 25 2z" fill={DARK} />
      <path d="M2 27C7 20 12 15 19 9" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TargetArrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" stroke={DARK} strokeLinecap="round">
      <path d="M22.5 11.5a10 10 0 1 1-6-6" strokeWidth="3" />
      <path d="M17.6 14a4.5 4.5 0 1 1-3.6-4.4" strokeWidth="3" />
      <path d="M13 15L25 3" strokeWidth="2.6" />
      <path d="M20.5 2.5v5h5" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

function ChartBars({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#FFFFFF">
      <rect x="3" y="14" width="4.5" height="7" rx="1" />
      <rect x="9.75" y="9" width="4.5" height="12" rx="1" />
      <rect x="16.5" y="3" width="4.5" height="18" rx="1" />
    </svg>
  );
}

function MortarIcon({ className, color = "#FFFFFF" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 28" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13h26c0 7-5.8 12-13 12S3 20 3 13z" />
      <path d="M17 12l9-9" strokeWidth="3" />
      <path d="M8 11c1-3 3-5 6-5M10 9.5c-.5-2 .3-4 2-5" />
    </svg>
  );
}

function DocSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 34" fill="none" stroke={DARK} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 31H5a2.5 2.5 0 0 1-2.5-2.5v-25A2.5 2.5 0 0 1 5 1h13l7 7v6" />
      <path d="M18 1v7h7" />
      <path d="M7.5 11h8M7.5 16h6M7.5 21h4" />
      <circle cx="22" cy="23" r="5" />
      <path d="M25.6 26.6L30 31" strokeWidth="2.8" />
    </svg>
  );
}

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 48" fill="none" stroke={GREEN} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
      <path d="M30 2C23.5 9.5 22.5 19 30 29C37.5 19 36.5 9.5 30 2z" />
      <path d="M30 29C21 28 14.5 20.5 16 9.5C23.5 12 28.5 19.5 30 29z" />
      <path d="M30 29C39 28 45.5 20.5 44 9.5C36.5 12 31.5 19.5 30 29z" />
      <path d="M30 29C19 31 8.5 27.5 2 18.5C11.5 16 21.5 19.5 27 26.5" />
      <path d="M30 29C41 31 51.5 27.5 58 18.5C48.5 16 38.5 19.5 33 26.5" />
      <path d="M30 8v17M24 24c-3-3-5-7-5-11M36 24c3-3 5-7 5-11" strokeWidth="1.1" />
      <path d="M19 37L30 46L41 37" strokeWidth="1.3" />
    </svg>
  );
}

function MailFilled({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 22 18" fill="none">
      <rect x="0.5" y="0.5" width="21" height="17" rx="3.5" fill="#0A3D2B" />
      <path d="M3 4.5l8 6 8-6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}



// Value badges at the bottom of the letter
function ValueMortar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 32" fill="none" stroke={GREEN} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 15h30c0 7.5-6.7 13-15 13S3 22.5 3 15z" />
      <path d="M12 29.5h12" />
      <path d="M20 13L31 2.5" strokeWidth="3.4" />
      <path d="M9 13c-1-3.5.5-6.5 4-7.5 1 3.5-.5 6.5-4 7.5z" fill={GREEN} />
      <path d="M14 13c.5-3 3-5 6-4.5-.5 3-3 5-6 4.5z" fill={GREEN} />
    </svg>
  );
}

function ValueSprout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 33" fill="none" stroke={GREEN} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 31V9" />
      <path d="M16 9c0-4 2.5-7 6-7.5.5 4-2 7-6 7.5zM16 9c0-4-2.5-7-6-7.5-.5 4 2 7 6 7.5z" />
      <path d="M16 18c1-4.5 5-7.5 10-7 0 4.5-4.5 7.5-10 7zM16 18c-1-4.5-5-7.5-10-7 0 4.5 4.5 7.5 10 7z" />
      <path d="M16 26c1-4 4.5-6 8.5-5.5-.5 3.5-4.5 6-8.5 5.5zM16 26c-1-4-4.5-6-8.5-5.5.5 3.5 4.5 6 8.5 5.5z" />
    </svg>
  );
}

function ValueLeaf({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke={GREEN} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M29 3C15 3 5 10 5 21c0 2.5.6 4.5 1.5 6C19 27 29 18 29 3z" />
      <path d="M2 30.5C8 23 14 17 22 10" />
      <path d="M12 21.5h7M15.5 17.5h6.5M10 15.5v-5M14.5 13V8" />
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

function CheckDot({ size = 18 }: { size?: number }) {
  return (
    <span className="aspect-square rounded-full bg-[#0B8A4F] flex items-center justify-center shrink-0" style={{ width: size, height: size, minWidth: size }}>
      <Check className="text-white stroke-[3.5]" style={{ width: size * 0.62, height: size * 0.62 }} />
    </span>
  );
}

function InfoDot({ size = 24 }: { size?: number }) {
  return (
    <span
      className="aspect-square rounded-full bg-[#2F80ED] flex items-center justify-center shrink-0 text-white font-bold"
      style={{ width: size, height: size, fontSize: size * 0.62 }}
    >
      i
    </span>
  );
}

function MatchDonut({ score }: { score: number }) {
  const r = 63;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <svg className="w-[144px] h-[144px] -rotate-90" viewBox="0 0 144 144">
      <circle cx="72" cy="72" r={r} stroke="#E4E5E6" strokeWidth="15" fill="none" />
      <circle cx="72" cy="72" r={r} stroke="#13A05F" strokeWidth="15" fill="none" strokeDasharray={`${filled * 0.55} ${c}`} />
      <circle cx="72" cy="72" r={r} stroke="#0B5A3A" strokeWidth="15" fill="none" strokeDasharray={`0 ${filled * 0.55} ${filled * 0.45} ${c}`} />
    </svg>
  );
}

/* ---------------- Template ---------------- */

export default function CandidateApplicationSubmittedTemplate({
  roleTitle = "Ayurvedic Doctor",
  candidateName = "Vijay Sharma",
  applicationId = "VS-CAR-2026-00187",
  applicationDate = "17 Oct 2026, 11:24 AM",
  preferredLocation = "Delhi NCR, Kalkaji Clinic",
  matchScore = 85,
}: CandidateApplicationSubmittedTemplateProps) {
  const [scale, setScale] = useState(MAX_SCALE);

  useEffect(() => {
    const update = () => setScale(Math.min(MAX_SCALE, document.documentElement.clientWidth / CANVAS_WIDTH));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const leftDetails: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <IdCard className="w-[24px] h-[21px]" />, label: "Application ID", value: applicationId },
    { icon: <BriefcaseFilled color={GREEN} className="w-[24px] h-[21px]" />, label: "Position Applied For", value: roleTitle },
    { icon: <MapPin className="w-[24px] h-[24px] text-[#0A3D2B] fill-[#0A3D2B] [&>circle]:fill-white" />, label: "Preferred Location", value: preferredLocation },
  ];

  const breakdown: { icon: React.ReactNode; label: string; value: number }[] = [
    { icon: <CapFilled className="w-[26px] h-[21px]" />, label: "Educational Qualification", value: 100 },
    { icon: <PeopleFilled className="w-[28px] h-[21px]" />, label: "Patient Counselling Skills", value: 90 },
    { icon: <BriefcaseFilled className="w-[25px] h-[21px]" />, label: "Relevant Experience", value: 85 },
    { icon: <DocFilled className="w-[19px] h-[24px]" />, label: "Documentation", value: 75 },
    { icon: <LeafFilled className="w-[25px] h-[25px]" />, label: "Panchakarma Knowledge", value: 80 },
    { icon: <TargetArrow className="w-[25px] h-[25px]" />, label: "Role Fit", value: 80 },
  ];

  const nextSteps: { icon: React.ReactNode; title: string; desc: React.ReactNode; left: number; width: number }[] = [
    {
      icon: <DocSearch className="w-[30px] h-[32px]" />,
      title: "Application Review",
      desc: (
        <>
          Our recruitment team
          <br />
          will review your application,
          <br />
          qualifications and
          <br />
          AI screening report.
        </>
      ),
      left: 46,
      width: 212,
    },
    {
      icon: <PeopleOutline className="w-[36px] h-[30px]" />,
      title: "Shortlisting",
      desc: (
        <>
          Candidates whose profiles
          <br />
          align with the requirements
          <br />
          may be shortlisted for
          <br />
          further evaluation.
        </>
      ),
      left: 293,
      width: 209,
    },
    {
      icon: <CalendarFilled color={DARK} className="w-[30px] h-[30px]" />,
      title: "Interview & Assessment",
      desc: (
        <>
          If shortlisted, our HR team
          <br />
          will contact you through
          <br />
          your registered email or
          <br />
          mobile number.
        </>
      ),
      left: 537,
      width: 206,
    },
    {
      icon: <Mail className="w-[34px] h-[30px] text-[#0A3D2B] stroke-[2]" />,
      title: "Final Communication",
      desc: (
        <>
          You will receive further
          <br />
          updates as the recruitment
          <br />
          process progresses.
        </>
      ),
      left: 778,
      width: 212,
    },
  ];

  const infoPoints: React.ReactNode[] = [
    "Your Application ID is your reference number for future correspondence.",
    <>
      Your AI screening score is a preliminary assessment and does not
      <br />
      guarantee selection.
    </>,
    "Final recruitment decisions are made by our authorised recruitment team.",
    "Please monitor your registered email address for further updates.",
  ];

  const values: { icon: React.ReactNode; label: React.ReactNode; x: number }[] = [
    { icon: <ValueMortar className="w-[36px] h-[32px]" />, label: <>Authentic<br />Ayurveda</>, x: 585 },
    { icon: <ValueSprout className="w-[32px] h-[33px]" />, label: <>Holistic<br />Wellness</>, x: 698 },
    { icon: <PeopleOutline className="w-[36px] h-[30px] [&_*]:stroke-[2.5]" />, label: <>Compassionate<br />Care</>, x: 812 },
    { icon: <ValueLeaf className="w-[32px] h-[32px]" />, label: <>Natural<br />Living</>, x: 931 },
  ];

  return (
    <div className="font-sans min-h-screen w-full bg-[#EDF2EB] overflow-x-hidden py-4">
      <div className="mx-auto" style={{ width: CANVAS_WIDTH, zoom: scale }}>
        <div
          className="relative overflow-hidden bg-[#FEFEFD] shadow-[0_10px_40px_rgba(10,47,45,0.10)]"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {/* ============ HEADER (banner, check mark, doctor, quote card come from the artwork) ============ */}
          <Image src="/email-assets/candidate/cand_header.webp" alt="Vaidhyashala - Together for a Healthier Tomorrow" width={1024} height={560} priority unoptimized className="absolute left-0 top-0 w-[1024px] h-[560px]" />

          {/* Corner leaves sit under all content */}
          <Image src="/email-assets/candidate/leaf_bl.webp" alt="" width={78} height={151} unoptimized className="absolute left-0 bottom-0 w-[78px] h-[151px] pointer-events-none select-none" />
          <Image src="/email-assets/candidate/leaf_br.webp" alt="" width={76} height={151} unoptimized className="absolute right-0 bottom-0 w-[76px] h-[151px] pointer-events-none select-none" />

          {/* Brand logo stacked (emblem above wordmark), same as the HR notification */}
          <Image src="/email-assets/hr/logo_icon.webp" alt="" width={460} height={373} priority unoptimized className="absolute left-[161px] top-[10px] w-[90px] h-auto" />
          <Image src="/email-assets/hr/logo_word.webp" alt="Vaidhyashala - Innovative Healing" width={1110} height={363} priority unoptimized className="absolute left-[110px] top-[64px] w-[196px] h-auto" />

          <h1 className={`${HEADING} absolute left-[57px] w-[600px] top-[242px] text-center text-[36px] font-bold leading-[40px]`}>
            Your Application Has Been
            <br />
            Successfully Submitted!
          </h1>
          <p className="absolute left-[57px] w-[600px] top-[330px] text-center text-[18px] leading-none text-[#1F2E3A]">
            Thank you for choosing Vaidhyashala – Innovative Healing.
          </p>

          {/* ============ GREETING ============ */}
          <p className={`absolute left-[47px] top-[405px] text-[21px] leading-none ${NAVY}`}>
            Dear <strong className="font-bold">{candidateName}</strong>,
          </p>
          <p className={`absolute left-[47px] top-[438px] text-[16px] font-bold leading-none ${NAVY}`}>Namo Gange Namaskar!</p>
          <p className={`absolute left-[47px] top-[461px] w-[730px] text-[16px] leading-[21.5px] ${NAVY}`}>
            Thank you for your interest in becoming a part of <strong className="font-bold">Vaidhyashala – Innovative Healing.</strong>
            <br />
            We are pleased to confirm that your application has been successfully received for the position of
            <br />
            <strong className="font-bold">{roleTitle}.</strong> We appreciate the time and effort you have invested in sharing your professional
            <br />
            qualifications, experience and aspirations with us.
          </p>

          {/* ============ YOUR APPLICATION DETAILS ============ */}
          <section className={cardClass} style={{ left: 35, top: 563, width: 958, height: 164 }}>
            <div className="absolute left-[24px] top-[8px] flex items-center gap-[14px]">
              <DocBadge />
              <h2 className={`${HEADING} text-[22px] font-bold leading-none`}>Your Application Details</h2>
            </div>

            {leftDetails.map(({ icon, label, value }, idx) => (
              <div key={label} className="absolute left-[20px] w-[457px] h-[34px] rounded-[6px] bg-white flex items-center" style={{ top: 45 + idx * 37 }}>
                <span className="absolute left-[20px] w-[26px] flex justify-center">{icon}</span>
                <span className="absolute left-[62px] text-[14.5px] text-[#3B4C78]">{label}</span>
                <span className={`absolute left-[220px] text-[14.5px] font-bold ${NAVY}`}>{value}</span>
              </div>
            ))}

            <div className="absolute left-[495px] w-[445px] h-[34px] rounded-[6px] bg-white flex items-center" style={{ top: 45 }}>
              <span className="absolute left-[18px] w-[26px] flex justify-center">
                <CalendarFilled color={DARK} className="w-[23px] h-[23px]" />
              </span>
              <span className="absolute left-[64px] text-[14.5px] text-[#3B4C78]">Application Date</span>
              <span className={`absolute left-[209px] text-[14.5px] font-bold ${NAVY}`}>{applicationDate}</span>
            </div>
            <div className="absolute left-[495px] w-[445px] h-[34px] rounded-[6px] bg-white flex items-center" style={{ top: 82 }}>
              <span className="absolute left-[18px] w-[26px] flex justify-center">
                <PeopleOutline color={DARK} className="w-[26px] h-[21px]" />
              </span>
              <span className="absolute left-[64px] text-[14.5px] text-[#3B4C78]">AI Profile Match</span>
              <span className="absolute left-[209px] text-[15px] font-bold text-[#0B6B44]">{matchScore}%</span>
            </div>
            <div className="absolute left-[495px] w-[445px] h-[34px] rounded-[6px] bg-white flex items-center" style={{ top: 119 }}>
              <span className="absolute left-[18px] w-[26px] flex justify-center">
                <Clock className="w-[23px] h-[23px] text-[#0A3D2B] stroke-[2.4]" />
              </span>
              <span className="absolute left-[64px] text-[14.5px] text-[#3B4C78]">Application Status</span>
              <span className="absolute left-[208px] h-[26px] px-[10px] rounded-[5px] bg-[#E2F0DC] flex items-center text-[14.5px] text-[#0D2E26]">
                Received – Awaiting HR Review
              </span>
            </div>
          </section>

          {/* ============ AI SCREENING RESULT + MATCH BREAKDOWN ============ */}
          <section className={cardClass} style={{ left: 35, top: 740, width: 958, height: 262 }}>
            <span className="absolute left-[15px] top-[2px] w-[46px] h-[46px] rounded-full bg-[#0B6B44] flex items-center justify-center">
              <ChartBars className="w-[24px] h-[24px]" />
            </span>
            <h2 className={`${HEADING} absolute left-[77px] top-[9px] text-[22px] font-bold leading-none`}>AI Screening Result</h2>
            <p className={`absolute left-[77px] top-[37px] text-[12.5px] leading-none whitespace-nowrap ${NAVY}`}>
              Here is your profile match and analysis for the applied position.
            </p>

            <div className="absolute left-[16px] top-[57px] w-[144px] h-[144px]">
              <MatchDonut score={matchScore} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-[36px] font-bold leading-none ${NAVY}`}>{matchScore}%</span>
                <span className={`mt-[6px] text-[12.5px] font-bold leading-none ${NAVY}`}>Match Score</span>
              </div>
            </div>

            <div className="absolute left-[198px] top-[75px] w-[219px] h-[123px] rounded-[8px] bg-[#EAF4E6]">
              <span className="absolute left-[11px] top-[12px] w-[28px] h-[28px] rounded-full bg-[#0B8A4F] flex items-center justify-center">
                <Check className="w-[17px] h-[17px] text-white stroke-[3.4]" />
              </span>
              <p className={`${HEADING} absolute left-[50px] top-[15px] text-[15.5px] font-bold leading-none`}>Eligibility Result</p>
              <p className="absolute left-[50px] top-[42px] text-[20px] font-bold leading-none text-[#0B6B44] whitespace-nowrap">Eligible to Apply</p>
              <p className={`absolute left-[50px] top-[74px] text-[12px] leading-[14.5px] ${NAVY}`}>
                You are eligible to apply for
                <br />
                this position based on our
                <br />
                AI screening.
              </p>
            </div>

            {/* Match Breakdown */}
            <span className="absolute left-[446px] top-[9px] w-[38px] h-[38px] rounded-full bg-[#0B6B44] flex items-center justify-center">
              <MortarIcon className="w-[22px] h-[20px]" />
            </span>
            <h3 className={`${HEADING} absolute left-[496px] top-[14px] text-[16px] font-bold leading-none`}>Match Breakdown</h3>
            <p className={`absolute left-[496px] top-[35px] text-[12px] leading-none whitespace-nowrap ${NAVY}`}>
              Here&apos;s how your profile aligns with the job requirements:
            </p>

            {breakdown.map(({ icon, label, value }, idx) => {
              const col = idx % 2;
              const row = Math.floor(idx / 2);
              const iconLeft = col === 0 ? 443 : 706;
              const textLeft = col === 0 ? 483 : 749;
              const barWidth = col === 0 ? 145 : 121;
              const pctRight = col === 0 ? 670 : 935;
              const top = 62 + row * 48;
              return (
                <React.Fragment key={label}>
                  <span className="absolute w-[28px] h-[26px] flex items-center justify-center" style={{ left: iconLeft, top: top + 4 }}>
                    {icon}
                  </span>
                  <p className={`absolute text-[12px] leading-none whitespace-nowrap ${NAVY}`} style={{ left: textLeft, top }}>
                    {label}
                  </p>
                  <div className="absolute h-[9px] rounded-full bg-[#E3E5E4] overflow-hidden" style={{ left: textLeft, top: top + 20, width: barWidth }}>
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0B6B44] to-[#13A05F]" style={{ width: `${value}%` }} />
                  </div>
                  <span className="absolute text-[13px] font-bold leading-none text-[#0D2E26]" style={{ right: 958 - pctRight, top: top + 17 }}>
                    {value}%
                  </span>
                </React.Fragment>
              );
            })}

            <div className="absolute left-[13px] right-[3px] top-[208px] h-[43px] rounded-[8px] bg-[#EAF1FB]">
              <span className="absolute left-[3px] top-[9px]">
                <InfoDot size={26} />
              </span>
              <p className={`absolute left-[38px] top-[6px] text-[12.5px] leading-[15.5px] ${NAVY}`}>
                This is a preliminary AI assessment based on the information provided in your application. Final recruitment decisions are made by our authorised
                <br />
                recruitment team after a complete review of your application, documents and further evaluation.
              </p>
            </div>
          </section>

          {/* ============ WHAT HAPPENS NEXT ============ */}
          <Settings className="absolute left-[48px] top-[1010px] w-[32px] h-[32px] text-[#0A3D2B] fill-[#0A3D2B] stroke-[2] [&>circle]:fill-white" />
          <h2 className={`${HEADING} absolute left-[92px] top-[1015px] text-[22px] font-bold leading-none`}>What Happens Next?</h2>

          {nextSteps.map(({ icon, title, desc, left, width }, idx) => (
            <React.Fragment key={title}>
              <div className="absolute top-[1044px] h-[143px] rounded-[8px] border border-[#E3ECE1] bg-[#F2F8EF]" style={{ left, width }}>
                <span className="absolute left-[12px] top-[7px] w-[33px] h-[33px] rounded-full bg-[#0B8A4F] flex items-center justify-center text-white text-[17px] font-bold">
                  {idx + 1}
                </span>
                <span className="absolute left-[58px] top-[5px] w-[40px] h-[36px] flex items-center justify-center">{icon}</span>
                <h3 className={`${HEADING} absolute left-[16px] top-[46px] text-[15.5px] font-bold leading-none whitespace-nowrap`}>{title}</h3>
                <p className={`absolute left-[16px] top-[65px] text-[14px] leading-[16.8px] whitespace-nowrap ${NAVY}`}>{desc}</p>
              </div>
              {idx < nextSteps.length - 1 && (
                <ChevronRight className="absolute top-[1104px] w-[22px] h-[22px] text-[#0B6B44] stroke-[2.6]" style={{ left: [265, 509, 750][idx] }} />
              )}
            </React.Fragment>
          ))}

          {/* ============ IMPORTANT INFORMATION ============ */}
          <section className="absolute rounded-[10px] bg-[#EAF1FB]" style={{ left: 44, top: 1194, width: 522, height: 144 }}>
            <span className="absolute left-[9px] top-[7px]">
              <InfoDot size={24} />
            </span>
            <h2 className="absolute left-[43px] top-[9px] text-[18px] font-bold leading-none text-[#0C1456]">Important Information</h2>
            <ul className="absolute left-[39px] top-[33px]">
              {infoPoints.map((point, idx) => (
                <li key={idx} className="flex items-start gap-[11px] text-[13.2px] leading-[15px] text-[#1B2468]" style={{ minHeight: idx === 1 ? 37 : 23 }}>
                  <CheckDot />
                  <span className="pt-[1px]">{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* ============ NEED ASSISTANCE ============ */}
          <section className={cardClass} style={{ left: 577, top: 1194, width: 414, height: 146 }}>
            <LotusIcon className="absolute left-[8px] top-[6px] w-[60px] h-[48px]" />
            <h2 className="absolute left-[78px] top-[9px] text-[17px] font-bold leading-none text-[#0A1A14]">Need Assistance?</h2>
            <p className="absolute left-[78px] top-[29px] text-[13.35px] leading-[16px] text-[#1A2552]">
              If you have any queries regarding your application,
              <br />
              please feel free to contact our HR Department.
            </p>
            <div className="absolute left-[12px] right-[12px] top-[66px] h-[73px] rounded-[8px] bg-white/70 border border-[#E3ECE1] text-[12px] leading-none">
              <div className="absolute left-[14px] top-[9px] flex items-center">
                <MailFilled className="w-[19px] h-[16px]" />
                <span className="absolute left-[29px] whitespace-nowrap text-[11.5px] text-[#0F2A2C]">HR Email</span>
                <a href="mailto:careers@vaidhyashala.com" className="absolute left-[110px] whitespace-nowrap hover:underline text-[#1B2A68]">
                  careers@vaidhyashala.com
                </a>
              </div>
              <div className="absolute left-[14px] top-[32px] flex items-center">
                <Phone className="w-[16px] h-[16px] text-[#0A3D2B] fill-[#0A3D2B]" />
                <span className="absolute left-[29px] whitespace-nowrap text-[11.5px] text-[#0F2A2C]">HR Phone</span>
                <a href="tel:+919876543210" className="absolute left-[110px] whitespace-nowrap hover:underline text-[#1B2A68]">
                  +91 98765 43210 <span className="text-[#0B6B44]">&nbsp;(Mon – Fri, 10 AM – 6 PM)</span>
                </a>
              </div>
              <div className="absolute left-[14px] top-[54px] flex items-center">
                <MapPin className="w-[17px] h-[17px] text-[#0A3D2B] fill-[#0A3D2B] [&>circle]:fill-white" />
                <span className="absolute left-[29px] whitespace-nowrap text-[11.5px] text-[#0F2A2C]">HR Location</span>
                <span className="absolute left-[110px] whitespace-nowrap text-[#1B2A68]">
                  Vaidhyashala Clinic, <span className="text-[#0B6B44]">Kalkaji, New Delhi – 110019</span>
                </span>
              </div>
            </div>
          </section>

          {/* ============ CLOSING + VALUES ============ */}
          <div className="absolute left-[47px] top-[1346px] text-[14.85px] leading-none text-[#151B5A]">
            <p>We look forward to exploring the possibility of welcoming you to our team.</p>
            <p className="mt-[8px]">Warm regards,</p>
            <p className="mt-[4px] text-[15.9px] font-bold text-[#0B1040]">Talent Acquisition Team</p>
            <p className="mt-[5px] text-[15.9px] font-bold text-[#0B1040]">Vaidhyashala – Innovative Healing</p>
          </div>

          {values.map(({ icon, label, x }) => (
            <div key={x} className="absolute top-[1350px] w-[110px] flex flex-col items-center" style={{ left: x - 55 }}>
              <span className="w-[51px] h-[51px] aspect-square rounded-full border border-[#D5E7D3] bg-white shadow-[0_1px_4px_rgba(11,107,68,0.08)] flex items-center justify-center">
                {icon}
              </span>
              <p className="mt-[5px] text-center text-[11px] leading-[12.5px] text-[#1A2060]">{label}</p>
            </div>
          ))}

          {/* green divider with leaf */}
          <div className="absolute left-[268px] top-[1436px] w-[148px] h-[2px] bg-gradient-to-r from-transparent via-[#7CC496] to-[#3FA567]" />
          <svg className="absolute z-10 left-[423px] top-[1428px] w-[18px] h-[16px]" viewBox="0 0 28 24" fill="none">
            <path d="M26 1C14 0 4 5 2.5 15c-.3 2 0 4 .8 5.5C14 21 24 14 26 1z" fill="#2E9E5B" />
            <path d="M1 23C6 17 11 12 18 7" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div className="absolute left-[447px] top-[1436px] w-[520px] h-[2px] bg-gradient-to-r from-[#3FA567] via-[#7CC496] to-transparent" />

          {/* ============ FOOTER ============ */}

          <footer className="absolute left-[44px] top-[1440px] w-[940px] h-[96px] rounded-t-[34px] bg-[#013528]">
            <span className="absolute left-[28px] top-[16px] w-[278px] h-[64px] rounded-[10px] bg-white flex items-center justify-center">
              <Image src="/email-assets/lo.webp" alt="Vaidhyashala - Innovative Healing" width={1600} height={373} unoptimized className="w-[250px] h-auto" />
            </span>
            <span className="absolute left-[310px] top-[14px] h-[66px] w-px bg-white/40" />
            <ul className="absolute left-[356px] top-[8px] text-[14px] leading-none text-white">
              <li className="h-[23px] flex items-center">
                <a href="https://www.vaidhyashala.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-[14px] hover:underline">
                  <Globe className="w-[16px] h-[16px]" />
                  www.vaidhyashala.com
                </a>
              </li>
              <li className="h-[23px] flex items-center">
                <a href="mailto:careers@vaidhyashala.com" className="flex items-center gap-[14px] hover:underline">
                  <Mail className="w-[16px] h-[16px] fill-white text-[#013528]" />
                  careers@vaidhyashala.com
                </a>
              </li>
              <li className="h-[23px] flex items-center gap-[14px]">
                <MapPin className="w-[16px] h-[16px] fill-white [&>circle]:fill-[#013528]" />
                Kalkaji, New Delhi – 110019
              </li>
            </ul>

            <div className="absolute left-[713px] top-[14px] flex items-center gap-[13px]">
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
                  className="w-[32px] h-[32px] aspect-square rounded-full bg-white flex items-center justify-center text-[#013528] hover:bg-[#E2F0DC] transition-colors"
                >
                  <Icon className="w-[17px] h-[17px]" />
                </a>
              ))}
            </div>
            <p className="absolute left-[699px] top-[58px] text-[14px] leading-none text-white whitespace-nowrap">Healing People | Enriching Lives</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
