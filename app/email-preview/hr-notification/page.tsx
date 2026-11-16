import { Suspense } from "react";
import HRNotificationPage from "@/components/email-templates/HRNotificationPage";

// "New application" email HR receives; details come from the URL
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EEF2EC]" />}>
      <HRNotificationPage />
    </Suspense>
  );
}
