import Link from "next/link";
import { getDb, schema as s } from "@/db";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";

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

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-page flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted">
        <Logo />
        <span>Attestatsiya · Milliy sertifikat · DTM (tez orada)</span>
        <span>Click va Payme orqali toʻlov — tez orada</span>
      </div>
    </footer>
  );
}
