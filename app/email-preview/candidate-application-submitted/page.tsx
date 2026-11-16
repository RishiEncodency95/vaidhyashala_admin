import { Suspense } from "react";
import CandidateApplicationSubmittedPage from "@/components/email-templates/CandidateApplicationSubmittedPage";

// "Application submitted" email the candidate receives; details come from the URL
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EDF2EB]" />}>
      <CandidateApplicationSubmittedPage />
    </Suspense>
  );
}
