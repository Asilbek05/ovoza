import Link from "next/link";
import { getDb, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { getSettings } from "@/lib/settings";

export async function SiteHeader() {
  const db = await getDb();
  const exams = await db.select().from(s.examTypes).where(eq(s.examTypes.isActive, true)).orderBy(s.examTypes.sort);
  const user = await getCurrentUser();
  const links = [
    ...exams.map((e) => ({ href: `/imtihon/${e.slug}`, label: e.name, soon: e.comingSoon })),
    { href: "/tariflar", label: "Tariflar", soon: false },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Asosiy" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex h-10 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold text-ink-2 transition hover:bg-primary-soft hover:text-primary-deep">
              {l.label}
              {l.soon ? <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] leading-none font-bold text-ink">tez orada</span> : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="outline" size="md" className="hidden sm:inline-flex">
              <Link href="/kabinet"><span className="flex size-7 items-center justify-center rounded-full bg-accent text-[12px] font-bold">{user.name.slice(0, 1).toUpperCase()}</span>Kabinet</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="hidden sm:inline-flex"><Link href="/kirish">Kirish</Link></Button>
              <Button asChild variant="plain" className="hidden sm:inline-flex"><Link href="/imtihon/attestatsiya">Bepul boshlash</Link></Button>
            </>
          )}
          <MobileMenu links={links} loggedIn={!!user} />
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const db = await getDb();
  const exams = await db.select().from(s.examTypes).where(eq(s.examTypes.isActive, true)).orderBy(s.examTypes.sort);
  const st = await getSettings();
  const col = "flex flex-col gap-2.5 text-[15px]";
  const a = "text-ink-2 transition hover:text-primary";
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-[15px] leading-relaxed text-muted">Xatoni ustoz ovozi bilan tushuntiradigan test platformasi. Attestatsiya va milliy sertifikatga tayyorgarlik.</p>
        </div>
        <nav aria-label="Imtihonlar" className={col}>
          <span className="font-display text-base font-bold">Imtihonlar</span>
          {exams.map((e) => <Link key={e.id} href={`/imtihon/${e.slug}`} className={a}>{e.name}{e.comingSoon ? " · tez orada" : ""}</Link>)}
        </nav>
        <nav aria-label="Platforma" className={col}>
          <span className="font-display text-base font-bold">Platforma</span>
          <Link href="/tariflar" className={a}>Tariflar</Link>
          <Link href="/#qanday" className={a}>Qanday ishlaydi</Link>
          <Link href="/#savollar" className={a}>Savol-javob</Link>
          <Link href="/kabinet" className={a}>Kabinet</Link>
        </nav>
        <nav aria-label="Aloqa" className={col}>
          <span className="font-display text-base font-bold">Aloqa</span>
          {st.site_telegram ? <a href={st.site_telegram} target="_blank" rel="noopener noreferrer" className={a}>Telegram</a> : null}
          {st.site_phone ? <a href={`tel:${st.site_phone.replace(/[^+\d]/g, "")}`} className={a}>{st.site_phone}</a> : null}
          {st.site_email ? <a href={`mailto:${st.site_email}`} className={a}>{st.site_email}</a> : null}
          <Link href="/aloqa" className={a}>Bogʻlanish</Link>
        </nav>
      </div>
      <div className="border-t border-line-2">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-muted">
          <span>© {new Date().getFullYear()} tushun. Barcha huquqlar himoyalangan.</span>
          <span className="flex gap-5"><Link href="/oferta" className="hover:text-primary">Ommaviy oferta</Link><Link href="/maxfiylik" className="hover:text-primary">Maxfiylik siyosati</Link></span>
        </div>
      </div>
    </footer>
  );
}
