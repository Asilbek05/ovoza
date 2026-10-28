"use client";
import { ExplanationPlayer } from "@/components/player/explanation-player";

const IMAGES = [
  { url: "/demo/qadam-1.svg", startSec: 0, caption: "Soddalashtirish" },
  { url: "/demo/qadam-2.svg", startSec: 22, caption: "Viyet teoremasi" },
  { url: "/demo/qadam-3.svg", startSec: 51, caption: "Tekshiruv" },
];

/** Live product demo for the landing hero: the real player, real demo audio. */
export function DemoCard() {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-float">
      <div className="flex items-center gap-3 border-b border-line-2 px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">KR</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Kamola ustoz</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success-ink"><span className="size-1.5 rounded-full bg-success" /> tushuntirish tayyor</span>
        </span>
        <span className="rounded-lg bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger-ink">1-savol · xato</span>
      </div>
      <div className="grid gap-0 bg-bg md:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-3 p-5 md:border-r md:border-line-2 md:p-6">
          <div className="bubble-in max-w-[92%] self-start bg-surface px-4 py-3 text-sm">
            <span className="mb-0.5 block text-xs font-semibold text-muted">Savol</span>
            Tenglamaning ildizlarini toping: <b>2x² − 8x + 6 = 0</b>
          </div>
          <div className="bubble-out self-end bg-danger-soft px-4 py-2.5">
            <span className="block text-xs font-bold text-danger-ink">Sizning javobingiz</span>
            <span className="text-sm font-bold line-through decoration-danger decoration-2">C) −1 va −3</span>
          </div>
          <div className="bubble-in max-w-[92%] self-start bg-surface px-4 py-3 text-sm">
            Toʻgʻri javob: <b className="text-success-ink">A) 1 va 3</b>
          </div>
          <p className="mt-auto hidden pt-4 text-xs font-semibold text-muted md:block">↗ Pleyerni bosing — bu haqiqiy demo.</p>
        </div>
        <div className="p-5 md:p-6">
          <ExplanationPlayer audioUrl="/demo/izoh-kvadrat.wav" durationSec={69.1} images={IMAGES} seed={3} compact />
        </div>
      </div>
    </div>
  );
}
