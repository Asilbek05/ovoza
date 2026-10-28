import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { Toaster } from "sonner";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  applicationName: "ovoza",
  openGraph: { type: "website", siteName: "ovoza", locale: "uz_UZ", title: "ovoza — xatoingizni ustoz ovoz bilan tushuntiradi", description: "Attestatsiya va milliy sertifikat testlari: har bir xatoga ustozning ovozli tushuntirishi va yechim rasmlari." },
  title: { default: "ovoza — xatoingizni ustoz ovoz bilan tushuntiradi", template: "%s · ovoza" },
  description: "Attestatsiya va milliy sertifikat demo testlari. Har bir xato savolga ustozning ovozli tushuntirishi va yechim rasmlari.",
};
export const viewport: Viewport = { themeColor: "#0E4A40", width: "device-width", initialScale: 1 };
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors toastOptions={{ style: { borderRadius: 18, fontFamily: "var(--font-sans)" } }} />
      </body>
    </html>
  );
}
