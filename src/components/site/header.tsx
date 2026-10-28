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
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 rounded-2xl border border-line bg-surface/90 pr-2 pl-4 shadow-card backdrop-blur-md sm:h-16 sm:pr-3">
        <Logo />
        <nav aria-label="Asosiy" className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold text-ink-2 transition hover:bg-bg hover:text-ink">
              {l.label}
              {l.soon ? <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs leading-none font-bold text-ink">tez orada</span> : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="soft" size="md" className="hidden sm:inline-flex">
              <Link href="/kabinet"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</span>Kabinet</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/kirish">Kirish</Link></Button>
              <Button asChild variant="primary" className="hidden sm:inline-flex"><Link href="/imtihon/attestatsiya">Bepul boshlash</Link></Button>
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
  const col = "flex flex-col gap-2.5 text-sm";
  const a = "text-white/65 transition hover:text-accent";
  return (
    <footer className="bg-ink text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo tone="light" />
          <p className="max-w-xs text-sm leading-relaxed text-white/60">Xatoni ustoz ovozi bilan tushuntiradigan test platformasi. Attestatsiya va milliy sertifikatga tayyorgarlik.</p>
        </div>
        <nav aria-label="Imtihonlar" className={col}>
          <span className="text-xs font-bold tracking-widest text-white/40 uppercase">Imtihonlar</span>
          {exams.map((e) => <Link key={e.id} href={`/imtihon/${e.slug}`} className={a}>{e.name}{e.comingSoon ? " · tez orada" : ""}</Link>)}
        </nav>
        <nav aria-label="Platforma" className={col}>
          <span className="text-xs font-bold tracking-widest text-white/40 uppercase">Platforma</span>
          <Link href="/tariflar" className={a}>Tariflar</Link>
          <Link href="/#qanday" className={a}>Qanday ishlaydi</Link>
          <Link href="/#savollar" className={a}>Savol-javob</Link>
          <Link href="/kabinet" className={a}>Kabinet</Link>
        </nav>
        <nav aria-label="Aloqa" className={col}>
          <span className="text-xs font-bold tracking-widest text-white/40 uppercase">Aloqa</span>
          {st.site_telegram ? <a href={st.site_telegram} target="_blank" rel="noopener noreferrer" className={a}>Telegram</a> : null}
          {st.site_phone ? <a href={`tel:${st.site_phone.replace(/[^+\d]/g, "")}`} className={a}>{st.site_phone}</a> : null}
          {st.site_email ? <a href={`mailto:${st.site_email}`} className={a}>{st.site_email}</a> : null}
          <Link href="/aloqa" className={a}>Bogʻlanish</Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-sm text-white/50">
          <span>© {new Date().getFullYear()} ovoza. Barcha huquqlar himoyalangan.</span>
          <span className="flex gap-5"><Link href="/oferta" className="hover:text-accent">Ommaviy oferta</Link><Link href="/maxfiylik" className="hover:text-accent">Maxfiylik siyosati</Link></span>
        </div>
      </div>
    </footer>
  );
}
