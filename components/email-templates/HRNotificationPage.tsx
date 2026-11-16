"use client";

import { useSearchParams } from "next/navigation";
import HRNotificationTemplate from "@/components/email-templates/HRNotificationTemplate";

export default function HRNotificationPage() {
  const searchParams = useSearchParams();
  const roleTitle = searchParams.get("role") || "Ayurvedic Doctor";
  const candidateName = searchParams.get("candidateName") || "Dr. Ananya Sharma";
  const email = searchParams.get("email") || "ananya.sharma@gmail.com";
  const location = searchParams.get("locations") || "Delhi NCR, Kalkaji Clinic";

  return (
    <HRNotificationTemplate
      roleTitle={roleTitle}
      candidateName={candidateName}
      email={email}
      location={location}
    />
  );
}
<q>



































































































  
</q>