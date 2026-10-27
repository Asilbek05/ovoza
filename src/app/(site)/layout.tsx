import { SiteFooter, SiteHeader } from "@/components/site/header";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { announcement } = await getSettings();
  return (
    <>
      <a href="#asosiy" className="sr-only z-[60] rounded-full bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">Asosiy qismga oʻtish</a>
      {announcement ? <div role="note" className="bg-primary-deep px-4 py-2.5 text-center text-[14px] font-semibold text-white">{announcement}</div> : null}
      <SiteHeader />
      <main id="asosiy">{children}</main>
      <SiteFooter />
    </>
  );
}
