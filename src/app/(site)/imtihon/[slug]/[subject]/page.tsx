import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { Clock, FileQuestion, Lock, ArrowRight } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { SUBJECT_COLORS, cn, type SubjectColor } from "@/lib/utils";

export default async function SubjectPage({ params }: { params: Promise<{ slug: string; subject: string }> }) {
  const { slug, subject } = await params;
  const db = await getDb();
  const [exam] = await db.select().from(s.examTypes).where(eq(s.examTypes.slug, slug));
  if (!exam) notFound();
  const [sub] = await db.select().from(s.subjects).where(and(eq(s.subjects.examTypeId, exam.id), eq(s.subjects.slug, subject), eq(s.subjects.isActive, true)));
  if (!sub) notFound();
  const tests = await db
    .select({ t: s.tests, q: sql<number>`(select count(*)::int from questions q where q.test_id = "tests"."id")` })
    .from(s.tests)
    .where(and(eq(s.tests.subjectId, sub.id), eq(s.tests.isPublished, true)))
    .orderBy(s.tests.sort, s.tests.id);
  const c = SUBJECT_COLORS[(sub.color as SubjectColor) in SUBJECT_COLORS ? (sub.color as SubjectColor) : "blue"];

  return (
    <div className="container-page pt-10 pb-20">
      <nav aria-label="Yoʻl" className="mb-6 text-sm font-semibold text-muted">
        <Link href="/" className="hover:text-primary">Bosh sahifa</Link> / <Link href={`/imtihon/${exam.slug}`} className="hover:text-primary">{exam.name}</Link> / <span className="text-ink">{sub.name}</span>
      </nav>
      <header className="mb-9 flex items-center gap-5">
        <span className={cn("flex size-[72px] shrink-0 items-center justify-center rounded-2xl font-display text-3xl font-bold", c.icon)}>{sub.name.slice(0, 1)}</span>
        <div>
          <p className="text-sm font-bold text-muted">{exam.name}</p>
          <h1 className="t-h1">{sub.name}</h1>
        </div>
      </header>
      {tests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-primary-mid/60 bg-surface px-6 py-14 text-center">
          <p className="font-display text-2xl font-bold">Testlar tayyorlanmoqda</p>
          <p className="mt-2 text-muted">Bu fan boʻyicha testlar tez orada qoʻshiladi.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map(({ t, q }) => (
            <Link key={t.id} href={`/test/${t.id}`} className="group flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 transition hover:-translate-y-0.5 hover:border-primary-mid hover:shadow-[0_20px_40px_-28px_rgb(22_58_158/0.5)]">
              <span className="flex items-start justify-between gap-3">
                <span className="font-display text-2xl leading-tight font-bold">{t.title}</span>
                {t.isFree ? <span className="shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-bold">Bepul</span> : <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-deep"><Lock className="size-3.5" /> Obuna</span>}
              </span>
              {t.description ? <span className="text-sm leading-relaxed text-muted">{t.description}</span> : null}
              <span className="mt-auto flex items-center justify-between">
                <span className="flex gap-4 text-sm font-semibold text-ink-2">
                  <span className="flex items-center gap-1.5"><FileQuestion className="size-4 text-primary" /> {q} savol</span>
                  <span className="flex items-center gap-1.5"><Clock className="size-4 text-primary" /> {t.durationMin} daq</span>
                </span>
                <span className="flex size-11 items-center justify-center rounded-full bg-primary text-white transition group-hover:translate-x-1"><ArrowRight className="size-5" /></span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
