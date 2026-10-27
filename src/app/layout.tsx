import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "@fontsource-variable/bricolage-grotesque";
import { Toaster } from "sonner";
import "./globals.css";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  applicationName: "tushun.",
  openGraph: { type: "website", siteName: "tushun.", locale: "uz_UZ", title: "tushun. — xatoingizni ustoz ovoz bilan tushuntiradi", description: "Attestatsiya va milliy sertifikat testlari: har bir xatoga ustozning ovozli tushuntirishi va yechim rasmlari." },
  title: { default: "tushun. — xatoingizni ustoz ovoz bilan tushuntiradi", template: "%s · tushun." },
  description: "Attestatsiya va milliy sertifikat demo testlari. Har bir xato savolga ustozning ovozli tushuntirishi va yechim rasmlari.",
};
export const viewport: Viewport = { themeColor: "#2557E8", width: "device-width", initialScale: 1 };
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
