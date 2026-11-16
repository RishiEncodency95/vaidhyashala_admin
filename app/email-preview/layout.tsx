import type { Metadata } from "next";
import { Lato } from "next/font/google";
import RequireAdminAuth from "@/components/auth/RequireAdminAuth";

// The emails are designed in Lato (same as the website and the real emails sent by the backend)
const lato = Lato({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "700", "900"],
  // Admin's `font-sans` reads --font-inter (globals.css), so inside the previews it points to Lato
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Email Preview",
};

/**
 * Design previews of the careers emails, shown on their own (no sidebar or topbar).
 * The emails actually sent are built in backend/src/services/templates.
 */
export default function EmailPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdminAuth>
      <div className={lato.variable}>{children}</div>
    </RequireAdminAuth>
  );
}
