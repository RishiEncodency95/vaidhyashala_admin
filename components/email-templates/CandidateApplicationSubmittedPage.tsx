"use client";

import { useSearchParams } from "next/navigation";
import CandidateApplicationSubmittedTemplate from "@/components/email-templates/CandidateApplicationSubmittedTemplate";

export default function CandidateApplicationSubmittedPage() {
  const searchParams = useSearchParams();
  const roleTitle = searchParams.get("role") || "Ayurvedic Doctor";
  const candidateName = searchParams.get("candidateName") || searchParams.get("name") || "Vijay Sharma";
  const applicationId = searchParams.get("id") || "VS-CAR-2026-00187";
  const applicationDate = searchParams.get("date") || "17 Oct 2026, 11:24 AM";
  const preferredLocation = searchParams.get("location") || searchParams.get("locations") || "Delhi NCR, Kalkaji Clinic";
  const matchScore = searchParams.get("score") ? Number(searchParams.get("score")) : 85;

  return (
    <CandidateApplicationSubmittedTemplate
      roleTitle={roleTitle}
      candidateName={candidateName}
      applicationId={applicationId}
      applicationDate={applicationDate}
      preferredLocation={preferredLocation}
      matchScore={matchScore}
    />
  );
}
