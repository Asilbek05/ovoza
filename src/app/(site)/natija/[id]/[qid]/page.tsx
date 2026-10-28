import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { getDb, schema as s } from "@/db";
import { getAttemptReview, getOwnedAttempt } from "@/lib/attempts";
import { ExplanationPlayer } from "@/components/player/explanation-player";
import { cn, formatDuration } from "@/lib/utils";
import { Replies, SimilarCard } from "./client";

export const metadata = { title: "Tushuntirish" };
const L = "ABCDEF";

export default async function AnalysisPage({ params }: { params: Promise<{ id: string; qid: string }> }) {
  const { id, qid } = await params;
  const owned = await getOwnedAttempt(id);
  if (!owned) notFound();
  if (!owned.user) redirect(`/royxat?next=/natija/${id}`);
  const r = await getAttemptReview(id, owned.user.id);
  const idx = r.items.findIndex((x) => x.questionId === Number(qid));
  const item = r.items[idx];
  if (!item) notFound();
  if (!item.unlocked) redirect("/tariflar");
  const q = r.questions.find((x) => x.id === item.questionId)!;
  const db = await getDb();
  const [ex] = await db.select().from(s.explanations).where(eq(s.explanations.questionId, q.id));
  const imgs = ex ? await db.select().from(s.explanationImages).where(eq(s.explanationImages.explanationId, ex.id)).orderBy(s.explanationImages.startSec) : [];
  const [sim] = await db.select().from(s.similarQuestions).where(eq(s.similarQuestions.questionId, q.id));
  const next = r.items.slice(idx + 1).find((x) => x.unlocked);
  const author = ex?.authorName || "Ustoz";
  const initials = author.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="container-page pt-4 pb-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href={`/natija/${id}`} className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[15px] font-semibold hover:border-primary-mid"><ArrowLeft className="size-4" /> Natija</Link>
        <span className="flex-1 font-display text-xl font-bold">Ovozli xabarlar</span>
        <span className="text-sm font-semibold text-muted">{idx + 1} / {r.items.length}</span>
        <div aria-hidden className="hidden h-2 w-48 overflow-hidden rounded-full bg-primary-soft sm:block"><div className="h-full bg-primary" style={{ width: `${((idx + 1) / r.items.length) * 100}%` }} /></div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr_320px]">
        <aside className="hidden rounded-[20px] border border-line bg-surface p-3 lg:block">
          {r.items.map((it) => (
            <Link
              key={it.questionId}
              href={it.unlocked ? `/natija/${id}/${it.questionId}` : "/tariflar"}
              className={cn("flex items-center gap-3 rounded-[14px] p-2.5 transition", it.questionId === item.questionId ? "bg-primary-soft" : "hover:bg-bg", !it.unlocked && "opacity-55")}
            >
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold", it.kind === "guess" ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger-ink")}>{it.number}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{it.topic ?? `${it.number}-savol`}</span>
                <span className="block text-[13px] text-muted">{it.unlocked ? (it.hasAudio ? `ovozli xabar · ${formatDuration(it.durationSec)}` : "matnli izoh") : "obuna bilan"}</span>
              </span>
            </Link>
          ))}
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[24px] border border-line bg-surface">
          <div className="flex items-center gap-3 border-b border-line-2 px-5 py-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary font-bold text-white">{initials}</span>
            <span className="min-w-0 flex-1"><span className="block text-[17px] font-bold">{author}</span><span className="block truncate text-[13px] text-muted">{item.number}-savol · {q.topic ?? r.subject.name}</span></span>
            <span className={cn("rounded-full px-3 py-1 text-[13px] font-bold", item.kind === "guess" ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger-ink")}>{item.kind === "guess" ? "taxmin" : item.kind === "skipped" ? "javobsiz" : "xato"}</span>
          </div>
          <div className="flex flex-col gap-3.5 bg-bg p-4 sm:p-6">
            <div className="bubble-in max-w-[92%] self-start bg-surface px-4 py-3.5 sm:max-w-[80%]">
              <span className="block text-[13px] font-semibold text-muted">Savol</span>
              <span className="mt-0.5 block text-[17px] leading-relaxed font-semibold whitespace-pre-line">{q.text}</span>
            </div>
            <div className={cn("bubble-out flex flex-col self-end px-4 py-3", item.kind === "guess" ? "bg-accent-soft" : "bg-danger-soft")}>
              <span className={cn("text-[12px] font-bold", item.kind === "guess" ? "text-accent-ink" : "text-danger-ink")}>{item.kind === "guess" ? "Siz taxmin qildingiz" : "Sizning javobingiz"}</span>
              <span className={cn("text-[16px] font-bold", item.kind === "wrong" && "line-through decoration-danger decoration-2")}>
                {item.selectedIndex === null ? "Javob berilmagan" : `${L[item.selectedIndex]}) ${q.options[item.selectedIndex]}`}
              </span>
            </div>
            <ExplanationPlayer audioUrl={ex?.audioUrl ?? null} durationSec={ex?.audioDurationSec} images={imgs.map((i) => ({ url: i.url, startSec: i.startSec, caption: i.caption }))} seed={q.id} />
            <div className="bubble-in max-w-[92%] self-start bg-surface px-4 py-3.5 text-[16px] leading-relaxed sm:max-w-[80%]">
              {ex?.note ? <p className="mb-2">{ex.note}</p> : null}
              <p>Toʻgʻri javob: <b className="text-success-ink">{L[q.correctIndex]}) {q.options[q.correctIndex]}</b></p>
            </div>
          </div>
          <Replies questionId={q.id} nextHref={next ? `/natija/${id}/${next.questionId}` : `/natija/${id}`} isLast={!next} />
        </section>

        <aside className="lg:col-span-2 xl:col-span-1">
          {sim ? <SimilarCard text={sim.text} options={sim.options} correctIndex={sim.correctIndex} /> : (
            <div className="rounded-[20px] border border-line bg-surface p-6">
              <p className="font-display text-lg font-bold">Bu mavzuda yana</p>
              <p className="mt-1.5 text-[15px] text-muted">«{q.topic ?? r.subject.name}» boʻyicha boshqa testlarni yeching.</p>
              <Link href={`/imtihon/${r.exam.slug}/${r.subject.slug}`} className="mt-3 inline-block font-bold text-primary hover:underline">Testlar →</Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
