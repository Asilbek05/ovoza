import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { ArrowRight, Bell } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { EXAM_ICON, EXAM_TONE } from "@/components/site/icons";
import { SUBJECT_COLORS, cn, type SubjectColor } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const db = await getDb();
  const [e] = await db.select().from(s.examTypes).where(eq(s.examTypes.slug, (await params).slug));
  return { title: e?.name ?? "Imtihon" };
}

export default async function ExamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await getDb();
  const [exam] = await db.select().from(s.examTypes).where(and(eq(s.examTypes.slug, slug), eq(s.examTypes.isActive, true)));
  if (!exam) notFound();
  const subjects = await db
    .select({
      sub: s.subjects,
      tests: sql<number>`(select count(*)::int from tests t where t.subject_id = "subjects"."id" and t.is_published)`,
      free: sql<number>`(select count(*)::int from tests t where t.subject_id = "subjects"."id" and t.is_published and t.is_free)`,
    })
    .from(s.subjects)
    .where(and(eq(s.subjects.examTypeId, exam.id), eq(s.subjects.isActive, true)))
    .orderBy(s.subjects.sort, s.subjects.name);
  const Icon = EXAM_ICON[exam.slug];
  const tone = EXAM_TONE[exam.slug] ?? EXAM_TONE.attestatsiya;

  return (
    <div className="container-page pt-6 pb-10">
      <nav aria-label="Yoʻl" className="mb-6 text-sm font-semibold text-muted"><Link href="/" className="hover:text-primary">Bosh sahifa</Link> / <span className="text-ink">{exam.name}</span></nav>
      <header className={cn("mb-10 flex flex-col gap-5 rounded-[36px] p-7 sm:flex-row sm:items-center sm:p-10", tone.card)}>
        {Icon ? <span className={cn("flex size-16 shrink-0 items-center justify-center rounded-[22px]", tone.icon)}><Icon className="size-8" /></span> : null}
        <div className="flex-1">
          <p className="text-sm font-bold">{exam.short}</p>
          <h1 className="font-display text-[38px] leading-tight font-extrabold sm:text-5xl">{exam.name}</h1>
          <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-ink-2">{exam.description}</p>
        </div>
      </header>

      {exam.comingSoon ? (
        <div className="flex flex-col items-center gap-4 rounded-[32px] border border-dashed border-primary-mid/60 bg-surface px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-accent"><Bell className="size-7" /></span>
          <h2 className="font-display text-3xl font-extrabold">Tez orada</h2>
          <p className="max-w-md text-[17px] text-muted">Bu boʻlim tayyorlanmoqda. Hozircha milliy sertifikat testlari bilan tayyorlanishingiz mumkin.</p>
          <Link href="/imtihon/milliy-sertifikat" className="font-bold text-primary hover:underline">Milliy sertifikat testlari →</Link>
        </div>
      ) : (
        <>
          <h2 className="mb-5 font-display text-2xl font-bold">Fanni tanlang</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(({ sub, tests, free }) => {
              const c = SUBJECT_COLORS[(sub.color as SubjectColor) in SUBJECT_COLORS ? (sub.color as SubjectColor) : "blue"];
              const empty = tests === 0;
              return (
                <Link
                  key={sub.id}
                  href={`/imtihon/${exam.slug}/${sub.slug}`}
                  className={cn("group flex items-center gap-4 rounded-[28px] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary-mid hover:shadow-[0_20px_40px_-28px_rgb(22_58_158/0.5)]", empty && "opacity-70")}
                >
                  <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-[18px] font-display text-2xl font-extrabold", c.icon)}>{sub.name.slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-xl leading-tight font-bold">{sub.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-muted">
                      {empty ? "Testlar tayyorlanmoqda" : `${tests} ta test`}
                      {free ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[12px] font-bold text-accent-ink">bepul bor</span> : null}
                    </span>
                  </span>
                  <ArrowRight className="size-5 text-primary transition group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
