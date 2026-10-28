import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock, Play, RotateCcw, Sparkles } from "lucide-react";
import { getOwnedAttempt, getAttemptReview } from "@/lib/attempts";
import { Button } from "@/components/ui/button";
import { Check, Clock, Flag, X as XIcon, Minus } from "lucide-react";
import { cn, formatClock, formatDuration, scoreLevel } from "@/lib/utils";

export const metadata = { title: "Natija" };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const owned = await getOwnedAttempt(id);
  if (!owned) notFound();
  if (!owned.attempt.finishedAt) redirect(`/urinish/${id}`);
  const r = await getAttemptReview(id, owned.user?.id ?? null);
  const total = r.questions.length || 1;
  const correct = r.attempt.correctCount;
  const pct = Math.round((correct / total) * 100);
  const wrong = r.items.filter((x) => x.kind !== "guess").length;
  const C = 2 * Math.PI * 96;
  const level = scoreLevel(pct);
  const avgSec = r.totalSec && r.rows.length ? r.totalSec / r.rows.length : 0;
  const slowest = [...r.rows].sort((a, b) => b.timeSec - a.timeSec)[0];
  const first = r.items.find((x) => x.unlocked);
  const weakest = r.topics.find((t) => t.correct / t.total < 0.6);

  return (
    <div className="container-page pt-6 pb-10">
      <section className="flex flex-col items-center gap-8 rounded-[28px] border border-line bg-surface p-7 sm:p-10 lg:flex-row lg:gap-12 lg:p-12">
        <div className="relative flex size-[200px] shrink-0 items-center justify-center sm:size-[230px]">
          <svg viewBox="0 0 230 230" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="115" cy="115" r="96" fill="none" stroke="var(--color-primary-soft)" strokeWidth="22" />
            <circle cx="115" cy="115" r="96" fill="none" stroke="var(--color-primary)" strokeWidth="22" strokeLinecap="round" strokeDasharray={`${(C * pct) / 100} ${C}`} />
          </svg>
          <span className="relative flex flex-col items-center">
            <span className="font-display text-[56px] leading-none font-extrabold">{correct}<span className="text-2xl text-muted">/{r.questions.length}</span></span>
            <span className="font-bold text-primary">{pct}%</span>
          </span>
        </div>
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-muted">{r.exam.name} · {r.test.title}</p>
            <span className={cn("rounded-full px-3 py-1 text-[13px] font-bold", level.tone)}>{level.label}</span>
          </div>
          <h1 className="font-serif text-[40px] leading-[1.1] font-normal tracking-[-0.02em] sm:text-[58px]">
            {r.items.length === 0 ? "Ajoyib! Hamma savolga ishonch bilan toʻgʻri javob berdingiz." : <>Tahlil qilishga arziydigan <em className="marker italic">{r.items.length} ta savol</em> bor.</>}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-success-soft px-3.5 py-2 text-sm font-bold text-success-ink">{correct} ta toʻgʻri</span>
            <span className="rounded-full bg-danger-soft px-3.5 py-2 text-sm font-bold text-danger-ink">{wrong} ta xato yoki javobsiz</span>
            {r.guesses ? <span className="rounded-full bg-accent-soft px-3.5 py-2 text-sm font-bold text-accent-ink">{r.guesses} tasi taxmin bilan topilgan</span> : null}
          </div>
          <p className="max-w-xl text-[16px] leading-relaxed text-muted">{level.note}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {!r.loggedIn ? (
              <Button asChild variant="primary" size="lg"><Link href={`/royxat?next=/natija/${id}`}><Sparkles /> Tushuntirishlarni ochish — bepul roʻyxat</Link></Button>
            ) : first ? (
              <Button asChild variant="primary" size="lg" className="pl-2"><Link href={`/natija/${id}/${first.questionId}`}><span className="flex size-10 items-center justify-center rounded-full bg-white text-primary"><Play className="size-4 fill-current" /></span>Tinglashni boshlash</Link></Button>
            ) : null}
            <Button asChild variant="outline" size="lg"><Link href={`/test/${r.test.id}`}><RotateCcw /> Qayta yechish</Link></Button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.5fr]">
        <section className="rounded-[24px] border border-line bg-surface p-6 sm:p-7">
          <h2 className="font-display text-2xl font-bold">Mavzular xaritasi</h2>
          <div className="mt-5 space-y-4">
            {r.topics.map((t) => {
              const p = t.correct / t.total;
              const weak = p < 0.6;
              return (
                <div key={t.name}>
                  <div className="mb-1.5 flex justify-between text-[15px] font-semibold"><span>{t.name}</span><span className={weak ? "text-danger-ink" : "text-primary-deep"}>{t.correct} / {t.total}</span></div>
                  <div className="h-3 overflow-hidden rounded-full bg-line-2"><div className={cn("h-full rounded-full", weak ? "bg-danger" : "bg-primary")} style={{ width: `${Math.max(4, p * 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
          {weakest ? <p className="mt-6 rounded-[16px] bg-accent-soft px-4 py-3.5 text-[15px] leading-relaxed"><b>Tavsiya:</b> avval «{weakest.name}» mavzusini takrorlang.</p> : null}
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-4 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-2 pb-3">
            <h2 className="font-display text-2xl font-bold">Ovozli xabarlar</h2>
            <span className="text-sm font-semibold text-muted">{r.items.length} ta</span>
          </div>
          {r.items.length === 0 ? <p className="px-2 py-6 text-muted">Tushuntirish kerak boʻlgan savol yoʻq.</p> : (
            <ul className="flex flex-col gap-1">
              {r.items.map((it) => {
                const inner = (
                  <>
                    <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold", it.kind === "guess" ? "bg-accent-soft text-accent-ink" : "bg-danger-soft text-danger-ink")}>{it.number}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-bold">{it.topic ?? it.text}</span>
                      <span className="block truncate text-sm text-muted">{it.kind === "guess" ? "Taxmin bilan topilgan" : it.kind === "skipped" ? "Javob berilmagan" : "Xato javob"}{it.images ? ` · ${it.images} ta rasm` : ""}</span>
                    </span>
                    {it.unlocked ? (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-bold text-primary-deep">{it.hasAudio ? <><Play className="size-3 fill-current" /> {formatDuration(it.durationSec)}</> : "izoh"}</span>
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg text-muted"><Lock className="size-4" /></span>
                    )}
                  </>
                );
                return (
                  <li key={it.questionId}>
                    {it.unlocked ? (
                      <Link href={`/natija/${id}/${it.questionId}`} className="flex items-center gap-3.5 rounded-[16px] p-2.5 transition hover:bg-bg">{inner}</Link>
                    ) : (
                      <Link href={r.loggedIn ? "/tariflar" : `/royxat?next=/natija/${id}`} className="flex items-center gap-3.5 rounded-[16px] p-2.5 opacity-75 transition hover:bg-bg">{inner}</Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {r.loggedIn && r.items.some((x) => !x.unlocked) ? (
            <div className="mt-3 flex flex-col gap-3 rounded-[16px] bg-primary-soft p-4 sm:flex-row sm:items-center">
              <p className="flex-1 text-[15px] font-semibold text-primary-deep">Bepul testda birinchi 3 ta tushuntirish ochiq. Qolganlari obuna bilan.</p>
              <Button asChild variant="plain"><Link href="/tariflar">Tariflar</Link></Button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-6 rounded-[24px] border border-line bg-surface p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-2 pb-4">
          <h2 className="font-display text-2xl font-bold">Barcha savollar</h2>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-muted">
            {r.totalSec ? <span className="flex items-center gap-1.5"><Clock className="size-4" /> jami {formatClock(r.totalSec)} · oʻrtacha {formatClock(avgSec)}</span> : null}
            {slowest && slowest.timeSec >= 30 ? <span>Eng uzoq: {slowest.number}-savol ({formatClock(slowest.timeSec)})</span> : null}
          </span>
        </div>
        <ul className="divide-y divide-line-2">
          {r.rows.map((row) => {
            const state = row.selectedIndex === null ? "skip" : row.isCorrect ? "ok" : "bad";
            return (
              <li key={row.questionId}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[14px] px-2 py-3 hover:bg-bg [&::-webkit-details-marker]:hidden">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", state === "ok" ? "bg-success-soft text-success-ink" : state === "bad" ? "bg-danger-soft text-danger-ink" : "bg-bg text-muted")}>
                      {state === "ok" ? <Check className="size-5" strokeWidth={2.6} /> : state === "bad" ? <XIcon className="size-5" strokeWidth={2.6} /> : <Minus className="size-5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold"><span className="text-muted tabular-nums">{row.number}.</span> {row.text}</span>
                      <span className="flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
                        {row.topic ? <span>{row.topic}</span> : null}
                        {row.timeSec ? <span className="tabular-nums">{formatClock(row.timeSec)}</span> : null}
                        {row.isGuess && state === "ok" ? <span className="font-semibold text-accent-ink">taxmin</span> : null}
                        {row.flagged ? <span className="flex items-center gap-1 font-semibold text-danger-ink"><Flag className="size-3 fill-current" /> belgilangan</span> : null}
                      </span>
                    </span>
                    <span className="text-muted transition group-open:rotate-180" aria-hidden>⌄</span>
                  </summary>
                  <div className="space-y-2 px-2 pt-1 pb-4 sm:pl-[60px]">
                    <p className="text-[16px] leading-relaxed font-semibold whitespace-pre-line">{row.text}</p>
                    {r.loggedIn || r.test.isFree ? (
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {row.options.map((o, j) => {
                          const right = j === row.correctIndex;
                          const mine = j === row.selectedIndex;
                          return (
                            <li key={j} className={cn("flex items-center gap-2.5 rounded-[14px] border px-3 py-2 text-[15px]", right ? "border-success bg-success-soft font-semibold text-success-ink" : mine ? "border-danger bg-danger-soft font-semibold text-danger-ink" : "border-line-2")}>
                              <span className="font-bold">{"ABCDEF"[j]}</span><span className="min-w-0 flex-1">{o}</span>
                              {right ? <span className="text-[12px] font-bold">toʻgʻri</span> : mine ? <span className="text-[12px] font-bold">sizniki</span> : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-[14px] bg-primary-soft px-3 py-2 text-[14px] font-semibold text-primary-deep">Javoblarni koʻrish uchun roʻyxatdan oʻting.</p>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
