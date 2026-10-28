import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { AudioLines, Clock, FileQuestion, HelpCircle, Lock } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getActiveSubscription } from "@/lib/access";
import { startAttempt } from "../../actions";
import { Button } from "@/components/ui/button";

export default async function TestIntro({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();
  const db = await getDb();
  const [row] = await db
    .select({ t: s.tests, sub: s.subjects, exam: s.examTypes })
    .from(s.tests)
    .innerJoin(s.subjects, eq(s.subjects.id, s.tests.subjectId))
    .innerJoin(s.examTypes, eq(s.examTypes.id, s.subjects.examTypeId))
    .where(and(eq(s.tests.id, id), eq(s.tests.isPublished, true)));
  if (!row) notFound();
  const { t, sub, exam } = row;
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.questions).where(eq(s.questions.testId, id));
  const user = await getCurrentUser();
  const sub_ = user ? await getActiveSubscription(user.id) : null;
  const locked = !t.isFree && !sub_;

  return (
    <div className="container-page max-w-3xl pt-10 pb-20">
      <nav aria-label="Yoʻl" className="mb-6 text-sm font-semibold text-muted">
        <Link href={`/imtihon/${exam.slug}`} className="hover:text-primary">{exam.name}</Link> / <Link href={`/imtihon/${exam.slug}/${sub.slug}`} className="hover:text-primary">{sub.name}</Link>
      </nav>
      <div className="rounded-3xl border border-line bg-surface p-7 sm:p-10">
        <span className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-bold text-primary-deep">{sub.name} · {exam.name}</span>
        <h1 className="mt-4 t-h1">{t.title}</h1>
        {t.description ? <p className="mt-3 text-base leading-relaxed text-muted">{t.description}</p> : null}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-bg p-4"><FileQuestion className="mb-2 size-5 text-primary" /><span className="block font-display text-3xl font-bold">{n}</span><span className="text-sm font-semibold text-muted">savol</span></div>
          <div className="rounded-2xl bg-bg p-4"><Clock className="mb-2 size-5 text-primary" /><span className="block font-display text-3xl font-bold">{t.durationMin}</span><span className="text-sm font-semibold text-muted">daqiqa</span></div>
        </div>
        <ul className="mt-7 space-y-3 text-base text-ink-2">
          <li className="flex gap-3"><Clock className="mt-0.5 size-5 shrink-0 text-primary" /> Vaqt tugasa, test avtomatik yakunlanadi. Javoblar har bosishda saqlanadi.</li>
          <li className="flex gap-3"><HelpCircle className="mt-0.5 size-5 shrink-0 text-accent-ink" /> Ishonchingiz komil boʻlmasa, «Taxmin qildim» ni bosing — bu savol ham tahlilga tushadi.</li>
          <li className="flex gap-3"><AudioLines className="mt-0.5 size-5 shrink-0 text-success" /> Javoblar oxirida ochiladi. Xatolarga ustoz ovozli xabar bilan tushuntiradi.</li>
        </ul>
        <div className="mt-9">
          {locked ? (
            <div className="flex flex-col gap-3 rounded-2xl bg-primary-soft p-5 sm:flex-row sm:items-center">
              <Lock className="size-6 shrink-0 text-primary" />
              <p className="flex-1 font-semibold text-primary-deep">Bu test obuna bilan ochiladi. Bepul demo testdan boshlashingiz ham mumkin.</p>
              <Button asChild variant="primary"><Link href={user ? "/tariflar" : `/kirish?next=/test/${id}`}>{user ? "Tarif tanlash" : "Kirish"}</Link></Button>
            </div>
          ) : n === 0 ? (
            <p className="rounded-2xl bg-accent-soft p-5 font-semibold text-accent-ink">Bu testning savollari tayyorlanmoqda. Tez orada ochiladi.</p>
          ) : (
            <form action={startAttempt.bind(null, id)}>
              <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">Testni boshlash</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
