import { notFound } from "next/navigation";
import { and, eq, gt, lt, desc, asc } from "drizzle-orm";
import { getDb, schema as s } from "@/db";
import { PageHeader } from "../../shell";
import { ExplanationEditor } from "./editor";

export const metadata = { title: "Tushuntirish" };

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) notFound();
  const db = await getDb();
  const [q] = await db.select().from(s.questions).where(eq(s.questions.id, id));
  if (!q) notFound();
  const [test] = await db.select().from(s.tests).where(eq(s.tests.id, q.testId));
  const [ex] = await db.select().from(s.explanations).where(eq(s.explanations.questionId, id));
  const imgs = ex ? await db.select().from(s.explanationImages).where(eq(s.explanationImages.explanationId, ex.id)).orderBy(s.explanationImages.startSec) : [];
  const [sim] = await db.select().from(s.similarQuestions).where(eq(s.similarQuestions.questionId, id));
  const [prev] = await db.select({ id: s.questions.id }).from(s.questions).where(and(eq(s.questions.testId, q.testId), lt(s.questions.position, q.position))).orderBy(desc(s.questions.position)).limit(1);
  const [next] = await db.select({ id: s.questions.id }).from(s.questions).where(and(eq(s.questions.testId, q.testId), gt(s.questions.position, q.position))).orderBy(asc(s.questions.position)).limit(1);
  const all = await db.select({ id: s.questions.id }).from(s.questions).where(eq(s.questions.testId, q.testId)).orderBy(s.questions.position, s.questions.id);
  const index = all.findIndex((x) => x.id === id) + 1;
  return (
    <>
      <PageHeader title={`${index}-savol tushuntirishi`} description="Ustoz bergan audio va yechim rasmlarini yuklang. Har bir rasm audioning qaysi soniyasida ochilishini belgilang — oʻngda foydalanuvchi koʻradigan koʻrinish." back={{ href: `/admin/testlar/${q.testId}`, label: test?.title ?? "Test" }} />
      <ExplanationEditor
        key={id}
        question={q}
        initial={{
          audioUrl: ex?.audioUrl ?? null,
          audioDurationSec: ex?.audioDurationSec ?? null,
          note: ex?.note ?? "",
          authorName: ex?.authorName ?? "",
          images: imgs.map((i) => ({ url: i.url, startSec: i.startSec, caption: i.caption })),
          similar: sim ? { text: sim.text, options: sim.options, correctIndex: sim.correctIndex } : null,
        }}
        prevId={prev?.id ?? null}
        nextId={next?.id ?? null}
      />
    </>
  );
}
