"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Flag, Grid3x3, HelpCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { finishAttempt, saveAnswer } from "@/app/(site)/actions";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Q = { id: number; text: string; options: string[]; topic: string | null };
type Cell = { selected: number | null; guess: boolean; flagged: boolean };
type A = Record<number, Cell>;
const L = "ABCDEF";
const EMPTY: Cell = { selected: null, guess: false, flagged: false };

function useCountdown(deadline: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.floor((deadline - now) / 1000));
}

export function Runner({ attemptId, title, subtitle, secondsLeft, questions, initial }: { attemptId: string; title: string; subtitle: string; secondsLeft: number; questions: Q[]; initial: A }) {
  // The server sends "seconds left", so a wrong phone clock can't cut the test short.
  const [deadline] = useState(() => Date.now() + secondsLeft * 1000);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [answers, setAnswers] = useState<A>(initial);
  const firstOpen = questions.findIndex((q) => initial[q.id]?.selected == null);
  const [i, setI] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [confirm, setConfirm] = useState(false);
  const [map, setMap] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const left = useCountdown(deadline);
  const q = questions[i];
  const cur = answers[q?.id] ?? EMPTY;
  const answered = useMemo(() => questions.filter((x) => answers[x.id]?.selected != null).length, [answers, questions]);
  const flaggedList = useMemo(() => questions.map((x, j) => ({ x, j })).filter(({ x }) => answers[x.id]?.flagged), [answers, questions]);
  const finished = useRef(false);
  const enteredAt = useRef(Date.now());
  const warned = useRef<Record<number, boolean>>({});

  /** Seconds spent on the current question since the last save — sent with the next write. */
  const takeSeconds = () => {
    const sec = (Date.now() - enteredAt.current) / 1000;
    enteredAt.current = Date.now();
    return sec;
  };

  const send = useCallback(
    (qid: number, cell: Cell, addSec: number) => {
      // one request at a time, in order — a quick tap sequence can't overwrite a newer answer
      queue.current = queue.current.then(() =>
        saveAnswer(attemptId, qid, { selected: cell.selected, guess: cell.guess, flagged: cell.flagged, addSec })
          .then((r) => {
            if (r.ok) return;
            if ("expired" in r && r.expired) void finish();
            else toast.error("Javob saqlanmadi. Internetni tekshiring.");
          })
          .catch(() => toast.error("Javob saqlanmadi. Internetni tekshiring.")),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attemptId],
  );

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    setFinishing(true);
    try {
      await queue.current;
      await finishAttempt(attemptId);
    } catch (e) {
      // redirect() from the server action surfaces as a thrown NEXT_REDIRECT — let it through
      if (e && typeof e === "object" && "digest" in e) throw e;
      finished.current = false;
      setFinishing(false);
      toast.error("Yakunlab boʻlmadi. Internetni tekshirib, qayta urinib koʻring.");
    }
  }, [attemptId]);

  useEffect(() => {
    if (left === 0 && !finished.current) {
      toast("Vaqt tugadi — test yakunlanmoqda");
      void finish();
    }
    for (const m of [5, 1]) {
      if (left === m * 60 && !warned.current[m]) {
        warned.current[m] = true;
        toast.warning(`${m} daqiqa qoldi`);
      }
    }
  }, [left, finish]);

  const update = (patch: Partial<Cell>) => {
    const next = { ...cur, ...patch };
    setAnswers((a) => ({ ...a, [q.id]: next }));
    send(q.id, next, takeSeconds());
  };

  /** Move to another question, saving the time spent on this one. */
  const go = (j: number) => {
    const target = Math.max(0, Math.min(questions.length - 1, j));
    if (target === i) return;
    const sec = takeSeconds();
    if (sec >= 1) send(q.id, cur, sec);
    setI(target);
    window.scrollTo({ top: 0 });
  };

  const requestFinish = () => {
    const sec = takeSeconds();
    if (sec >= 1) send(q.id, cur, sec);
    setConfirm(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = L.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && idx >= 0 && idx < (q?.options.length ?? 0)) update({ selected: idx });
      else if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
      else if (e.key.toLowerCase() === "f") update({ flagged: !cur.flagged });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const low = left < 300;

  const QuestionMap = (
    <div className="grid grid-cols-7 gap-2">
      {questions.map((x, j) => {
        const a = answers[x.id];
        const state = j === i ? "cur" : a?.selected != null ? (a.guess ? "guess" : "done") : "empty";
        return (
          <button
            key={x.id}
            onClick={() => { go(j); setMap(false); }}
            aria-label={`${j + 1}-savol${a?.flagged ? ", belgilangan" : ""}${a?.selected != null ? ", javob berilgan" : ""}`}
            aria-current={j === i ? "step" : undefined}
            className={cn(
              "relative flex aspect-square items-center justify-center rounded-full text-[14px] font-bold transition",
              state === "cur" && "bg-primary text-white ring-4 ring-primary/20",
              state === "done" && "bg-primary-mid text-ink",
              state === "guess" && "bg-accent text-ink",
              state === "empty" && "bg-bg text-muted hover:bg-primary-soft",
            )}
          >
            {j + 1}
            {a?.flagged ? <Flag className="absolute -top-1 -right-1 size-4 fill-danger text-danger" strokeWidth={2} /> : null}
          </button>
        );
      })}
    </div>
  );

  if (!q) return <p className="p-10 text-center">Bu testda savol yoʻq.</p>;

  const Legend = (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-muted">
      <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-primary-mid" /> javob berilgan</span>
      <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-accent" /> taxmin</span>
      <span className="flex items-center gap-1.5"><Flag className="size-3 fill-danger text-danger" /> belgilangan</span>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center gap-3 sm:h-[72px] sm:gap-4">
          <LogoMark className="hidden sm:inline-flex" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold sm:text-base">{title}</p>
            <p className="truncate text-[13px] text-muted">{subtitle}</p>
          </div>
          <span
            role="timer"
            className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 font-display text-[17px] font-bold tabular-nums transition-colors", low ? "bg-danger-soft text-danger-ink" : "bg-primary-soft text-primary-deep", left < 60 && "animate-pulse")}
            aria-label={`Qolgan vaqt ${mm} daqiqa ${ss} soniya`}
          >
            <Clock className="size-4" /> {mm}:{ss}
          </span>
          <Button variant="outline" className="hidden sm:inline-flex" onClick={requestFinish}>Yakunlash</Button>
        </div>
        <div className="h-1 bg-primary-soft"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(answered / questions.length) * 100}%` }} /></div>
      </header>

      <main className="container-page flex flex-1 gap-7 pt-6 pb-32 lg:pt-10 lg:pb-12">
        <section className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-white">{i + 1}-savol / {questions.length}</span>
            {q.topic ? <span className="rounded-full bg-primary-soft px-3 py-1.5 text-[13px] font-semibold text-primary-deep">{q.topic}</span> : null}
            <span className="flex-1" />
            <button
              onClick={() => update({ flagged: !cur.flagged })}
              aria-pressed={cur.flagged}
              className={cn("flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition", cur.flagged ? "border-danger bg-danger-soft text-danger-ink" : "border-line bg-surface text-ink-2 hover:border-primary-mid")}
            >
              <Flag className={cn("size-4", cur.flagged && "fill-current")} /> {cur.flagged ? "Belgilangan" : "Belgilash"}
            </button>
            <button onClick={() => setMap(true)} className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold lg:hidden"><Grid3x3 className="size-4" /> Savollar</button>
          </div>
          <div key={q.id} className="animate-[fade-up_.25s_ease-out] rounded-[32px] border border-line bg-surface p-6 sm:p-10">
            <p className="font-display text-[22px] leading-snug font-bold whitespace-pre-line sm:text-[28px]">{q.text}</p>
            <div role="radiogroup" aria-label="Javob variantlari" className="mt-7 grid gap-3 sm:grid-cols-2">
              {q.options.map((o, j) => {
                const on = cur.selected === j;
                return (
                  <button
                    key={j}
                    role="radio"
                    aria-checked={on}
                    onClick={() => update({ selected: on ? null : j })}
                    className={cn(
                      "flex min-h-[68px] items-center gap-4 rounded-[20px] border-2 px-4 py-3 text-left text-[18px] font-semibold transition active:scale-[0.99] sm:min-h-[76px]",
                      on ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-primary-mid hover:bg-[#fafcff]",
                    )}
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-base font-bold transition", on ? "bg-primary text-white" : "bg-bg text-ink-2")}>{L[j]}</span>
                    <span className="min-w-0 break-words">{o}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-[22px] bg-[#FFF8DD] p-4 sm:flex-row sm:items-center">
              <span className="flex-1 text-[15px] font-bold">Javobingizga qanchalik ishonchingiz komil?</span>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => update({ guess: false })} aria-pressed={!cur.guess} className={cn("flex h-11 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap transition sm:px-4 sm:text-sm", !cur.guess ? "bg-ink text-white" : "border border-[#E6C34A] bg-surface")}><ShieldCheck className="size-4" /> Aniq bilaman</button>
                <button onClick={() => update({ guess: true })} aria-pressed={cur.guess} className={cn("flex h-11 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap transition sm:px-4 sm:text-sm", cur.guess ? "bg-accent text-ink" : "border border-[#E6C34A] bg-surface")}><HelpCircle className="size-4" /> Taxmin qildim</button>
              </div>
            </div>
          </div>
          <div className="mt-5 hidden gap-3 lg:flex">
            <Button variant="outline" size="lg" disabled={i === 0} onClick={() => go(i - 1)}><ArrowLeft /> Oldingi</Button>
            <span className="flex-1" />
            {i < questions.length - 1 ? <Button variant="plain" size="lg" onClick={() => go(i + 1)}>Keyingi savol <ArrowRight /></Button> : <Button variant="primary" size="lg" onClick={requestFinish}>Testni yakunlash</Button>}
          </div>
        </section>

        <aside className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-28 space-y-4">
            <div className="rounded-[28px] border border-line bg-surface p-6">
              <div className="mb-4 flex items-baseline justify-between"><span className="font-display text-xl font-bold">Savollar</span><span className="text-sm font-semibold text-muted">{answered} / {questions.length}</span></div>
              {QuestionMap}
              {Legend}
            </div>
            <p className="rounded-[24px] bg-primary-soft p-5 text-[14px] leading-relaxed text-primary-deep">
              Klaviatura: <b>A–D</b> — javob, <b>← →</b> — savollar, <b>F</b> — belgilash.
            </p>
          </div>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface p-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="size-14" aria-label="Oldingi" disabled={i === 0} onClick={() => go(i - 1)}><ArrowLeft className="size-5" /></Button>
          {i < questions.length - 1 ? (
            <Button variant="plain" size="lg" className="flex-1" onClick={() => go(i + 1)}>Keyingi savol <ArrowRight /></Button>
          ) : (
            <Button variant="primary" size="lg" className="flex-1" onClick={requestFinish}>Yakunlash</Button>
          )}
        </div>
      </div>

      <Dialog open={map} onOpenChange={setMap}>
        <DialogContent>
          <DialogHeader><DialogTitle>Savollar</DialogTitle><DialogDescription>{answered} / {questions.length} ta javob berildi</DialogDescription></DialogHeader>
          {QuestionMap}
          {Legend}
          <Button variant="outline" className="mt-5 w-full" onClick={() => { setMap(false); requestFinish(); }}>Testni yakunlash</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testni yakunlaysizmi?</DialogTitle>
            <DialogDescription>Yakunlagandan keyin javoblarni oʻzgartirib boʻlmaydi.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[18px] bg-primary-soft p-3"><b className="block font-display text-2xl">{answered}</b><span className="text-[13px] font-semibold text-primary-deep">javob berilgan</span></div>
            <div className={cn("rounded-[18px] p-3", questions.length - answered ? "bg-danger-soft" : "bg-success-soft")}><b className="block font-display text-2xl">{questions.length - answered}</b><span className={cn("text-[13px] font-semibold", questions.length - answered ? "text-danger-ink" : "text-success-ink")}>javobsiz</span></div>
            <div className="rounded-[18px] bg-accent-soft p-3"><b className="block font-display text-2xl">{flaggedList.length}</b><span className="text-[13px] font-semibold text-accent-ink">belgilangan</span></div>
          </div>
          {flaggedList.length ? (
            <p className="mt-4 text-[15px] text-muted">Belgilangan savollar: {flaggedList.map(({ j }) => (
              <button key={j} className="mr-1.5 font-bold text-primary underline underline-offset-2" onClick={() => { setConfirm(false); go(j); }}>{j + 1}</button>
            ))}</p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)}>Davom etish</Button>
            <Button variant="plain" disabled={finishing} onClick={finish}>{finishing ? "Hisoblanmoqda…" : "Yakunlash va natijani koʻrish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
