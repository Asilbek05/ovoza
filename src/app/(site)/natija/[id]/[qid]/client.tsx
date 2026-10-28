"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, X } from "lucide-react";
import { sendFeedback } from "@/app/(site)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Replies({ questionId, nextHref, isLast }: { questionId: number; nextHref: string; isLast: boolean }) {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap gap-2 border-t border-line-2 p-4 sm:px-6">
      <Button asChild variant="plain" size="lg" className="flex-1 sm:flex-none" onClick={() => void sendFeedback(questionId, "understood")}>
        <Link href={nextHref}><Check /> {isLast ? "Tushundim, natijaga qaytish" : "Tushundim, keyingisi"} {isLast ? null : <ArrowRight />}</Link>
      </Button>
      <Button
        variant="soft"
        size="lg"
        disabled={sent === "not"}
        className="flex-1 sm:flex-none"
        onClick={async () => { await sendFeedback(questionId, "not_understood"); setSent("not"); toast.success("Rahmat! Ustoz bu tushuntirishni qayta koʻrib chiqadi."); }}
      >
        {sent === "not" ? "Yuborildi" : "Tushunmadim"}
      </Button>
    </div>
  );
}

const L = "ABCDEF";
export function SimilarCard({ text, options, correctIndex }: { text: string; options: string[]; correctIndex: number }) {
  const [pick, setPick] = useState<number | null>(null);
  const ok = pick === correctIndex;
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-accent-soft p-6">
      <span className="text-xs font-bold tracking-wider text-accent-ink uppercase">Oʻxshash savol</span>
      <p className="font-display text-xl leading-snug font-bold">Tushunganingizni tekshiring</p>
      <p className="rounded-xl bg-surface px-4 py-3.5 text-center font-display text-lg leading-snug font-bold">{text}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o, j) => {
          const on = pick === j;
          return (
            <button
              key={j}
              onClick={() => setPick(j)}
              disabled={pick !== null && ok}
              className={cn(
                "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-2 px-2 text-sm font-bold transition",
                !on && "border-accent-ring bg-surface hover:border-accent",
                on && j === correctIndex && "border-success bg-success-soft text-success-ink",
                on && j !== correctIndex && "border-danger bg-danger-soft text-danger-ink",
              )}
            >
              {on ? (j === correctIndex ? <Check className="size-4" /> : <X className="size-4" />) : <span className="text-muted">{L[j]})</span>} {o}
            </button>
          );
        })}
      </div>
      {pick !== null ? (
        <p role="status" className={cn("text-sm font-bold", ok ? "text-success-ink" : "text-danger-ink")}>
          {ok ? "Toʻgʻri! Mavzuni tushundingiz." : "Yana bir urinib koʻring — tushuntirishni qayta tinglash ham mumkin."}
        </p>
      ) : null}
    </div>
  );
}
