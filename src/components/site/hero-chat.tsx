import { Check } from "lucide-react";
import { waveform } from "@/lib/utils";

/** Static product mockup used on the landing page hero. */
export function HeroChat() {
  const bars = waveform(32, 2);
  return (
    <div className="relative mx-auto w-full max-w-[470px] pt-4 pb-2 lg:mr-0 lg:ml-auto">
      {/* sound ripples behind the card */}
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-0 size-[520px] -translate-x-1/2 -translate-y-1/2 sm:size-[640px]">
        {[1, 0.74, 0.5].map((s, i) => (
          <span key={i} className="absolute inset-0 m-auto rounded-full border border-primary/15" style={{ width: `${s * 100}%`, height: `${s * 100}%`, background: i === 2 ? "color-mix(in srgb, var(--color-accent) 35%, transparent)" : undefined }} />
        ))}
      </div>
      <div className="relative overflow-hidden rounded-[24px] border border-line bg-surface shadow-float">
        <div className="flex items-center gap-3 border-b border-line-2 px-5 py-4">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-accent">KR</span>
          <span className="min-w-0 flex-1"><span className="block font-semibold">Kamola ustoz</span><span className="flex items-center gap-1.5 text-[13px] font-semibold text-success"><span className="size-1.5 rounded-full bg-success" /> tushuntirish tayyor</span></span>
          <span className="rounded-lg bg-danger-soft px-2.5 py-1 text-[12px] font-bold text-danger-ink">12-savol</span>
        </div>
        <div className="flex flex-col gap-3 bg-bg p-4 sm:p-5">
          <div className="bubble-in max-w-[88%] self-start bg-surface px-4 py-3 text-[15px]">Tenglamaning ildizlari: <b className="font-bold">2x² − 8x + 6 = 0</b></div>
          <div className="bubble-out self-end bg-danger-soft px-4 py-2.5"><span className="block text-[12px] font-bold text-danger-ink">Sizning javobingiz</span><span className="font-bold line-through decoration-danger decoration-2">C) −1 va −3</span></div>
          <div className="bubble-in flex w-[88%] items-center gap-3 self-start bg-primary p-2.5 pr-4 text-white">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-ink">
              <span aria-hidden className="absolute inset-0 animate-[ping-soft_2s_ease-out_infinite] rounded-full bg-accent" />
              <svg viewBox="0 0 24 24" className="relative ml-0.5 size-4 fill-current" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
            <span aria-hidden className="flex h-8 min-w-0 flex-1 items-center gap-[2px]">
              {bars.map((h, i) => <span key={i} className={i < 13 ? "flex-1 rounded-full bg-accent" : "flex-1 rounded-full bg-white/35"} style={{ height: `${Math.round(h * 100)}%` }} />)}
            </span>
            <span className="text-[13px] font-semibold tabular-nums">2:14</span>
          </div>
          <div className="bubble-in grid w-[88%] grid-cols-3 gap-1.5 self-start bg-surface p-2">
            {[1, 2, 3].map((n) => (
              <span key={n} className="relative flex aspect-square flex-col justify-center gap-1.5 rounded-[12px] border border-line-2 bg-bg p-2.5">
                <span className="absolute top-1.5 left-2 text-[11px] font-bold text-muted">{n}</span>
                <span className="h-1 w-4/5 rounded-full bg-primary-mid" /><span className="h-1.5 w-2/3 rounded-full bg-accent" /><span className="h-1 w-3/4 rounded-full bg-primary-mid" />
              </span>
            ))}
          </div>
          <div className="bubble-in max-w-[88%] self-start bg-surface px-4 py-3 text-[15px] leading-snug">Viyet boʻyicha yigʻindi <b>+4</b>, siz −4 olgansiz. Toʻgʻrisi — <b className="text-success">A) 1 va 3</b></div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-line-2 px-4 py-3.5">
          <span className="flex items-center gap-1.5 rounded-[12px] bg-primary px-4 py-2.5 text-sm font-bold text-white"><Check className="size-4" /> Tushundim</span>
          <span className="rounded-[12px] bg-primary-soft px-4 py-2.5 text-sm font-bold text-primary-deep">Oʻxshash savol</span>
        </div>
      </div>
      <span className="absolute -top-1 -left-2 -rotate-[4deg] rounded-xl bg-accent px-3.5 py-2 text-[15px] font-bold shadow-[0_12px_24px_-12px_rgb(30_15_92/0.5)] sm:-left-6">audio + 3 ta yechim rasmi</span>
    </div>
  );
}
