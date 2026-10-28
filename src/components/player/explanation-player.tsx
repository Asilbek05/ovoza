"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn, formatDuration, waveform } from "@/lib/utils";

export type PlayerImage = { url: string; startSec: number; caption: string };

const SPEEDS = [1, 1.25, 1.5];

/**
 * The heart of the product: a voice message whose solution images change in sync with the audio.
 * Renders as two chat bubbles — the voice note and the image card.
 */
export function ExplanationPlayer({
  audioUrl, durationSec, images, seed = 3, onTime, compact = false,
}: {
  audioUrl: string | null;
  durationSec?: number | null;
  images: PlayerImage[];
  seed?: number;
  onTime?: (t: number) => void;
  compact?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(durationSec ?? 0);
  const [speed, setSpeed] = useState(0);
  const [manual, setManual] = useState<number | null>(null);
  const [broken, setBroken] = useState(false);
  const bars = useMemo(() => waveform(compact ? 34 : 54, seed), [seed, compact]);
  const sorted = useMemo(() => [...images].sort((a, b) => a.startSec - b.startSec), [images]);

  const autoIndex = useMemo(() => {
    let idx = 0;
    sorted.forEach((im, i) => { if (t >= im.startSec) idx = i; });
    return idx;
  }, [t, sorted]);
  const active = manual ?? autoIndex;

  useEffect(() => { if (durationSec) setDur(durationSec); }, [durationSec]);

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a || !audioUrl) return;
    if (a.paused) a.play().catch(() => setBroken(true)); else a.pause();
  }, [audioUrl]);

  // Space plays/pauses from anywhere on the page, except while typing or on another control
  useEffect(() => {
    if (!audioUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.defaultPrevented) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(el.tagName) || el.getAttribute("role") === "slider")) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [audioUrl, toggle]);

  const seek = (sec: number) => {
    const a = audio.current;
    setManual(null);
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(sec, dur || sec));
    setT(a.currentTime);
    onTime?.(a.currentTime);
  };

  const progress = dur ? Math.min(1, t / dur) : 0;
  const img = sorted[active];

  return (
    <div className="flex flex-col gap-3">
      {/* Voice note bubble */}
      <div className={cn("bubble-in w-full max-w-[560px] self-start bg-primary p-2.5 pr-4 text-white", compact && "max-w-none")}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={!audioUrl}
            aria-label={playing ? "Pauza" : "Tinglash"}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-primary transition hover:scale-105 disabled:opacity-60 sm:size-[52px]"
          >
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
          </button>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Audio holati"
            aria-valuemin={0}
            aria-valuemax={Math.round(dur)}
            aria-valuenow={Math.round(t)}
            aria-valuetext={`${formatDuration(t)} / ${formatDuration(dur)}`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              seek(((e.clientX - r.left) / r.width) * dur);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") seek(t + 5);
              if (e.key === "ArrowLeft") seek(t - 5);
              if (e.key === " ") { e.preventDefault(); toggle(); }
            }}
            className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-[2px]"
          >
            {bars.map((h, i) => (
              <span key={i} className={cn("flex-1 rounded-full transition-colors", i / bars.length < progress ? "bg-white" : "bg-white/40")} style={{ height: `${Math.round(h * 100)}%` }} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const n = (speed + 1) % SPEEDS.length;
              setSpeed(n);
              if (audio.current) audio.current.playbackRate = SPEEDS[n];
            }}
            className="h-8 min-w-[52px] shrink-0 rounded-full bg-white/20 px-2 text-[13px] font-bold hover:bg-white/30"
            aria-label="Tezlik"
          >
            {SPEEDS[speed]}×
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between pr-1 pl-[62px] text-[13px] font-medium text-white/85">
          <span className="tabular-nums">{formatDuration(t)} / {formatDuration(dur)}</span>
          {img?.caption ? <span className="truncate pl-3">{img.caption}</span> : null}
        </div>
        {audioUrl ? (
          <audio
            ref={audio}
            src={audioUrl}
            preload="metadata"
            controlsList="nodownload"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setBroken(true)}
            onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0) setDur(d); }}
            onTimeUpdate={(e) => { setT(e.currentTarget.currentTime); onTime?.(e.currentTarget.currentTime); if (manual !== null) setManual(null); }}
          />
        ) : null}
      </div>

      {/* Solution images bubble */}
      {sorted.length ? (
        <div className={cn("bubble-in w-full max-w-[560px] self-start bg-surface p-2.5", compact && "max-w-none")}>
          <div className="relative overflow-hidden rounded-[16px] border border-line-2 bg-bg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={img?.url} src={img?.url} alt={img?.caption || `Yechim rasmi ${active + 1}`} className="aspect-[8/5] w-full object-contain" />
            <span className="absolute top-2.5 right-2.5 rounded-full bg-ink/80 px-2.5 py-1 text-[12px] font-bold text-white">{active + 1} / {sorted.length}</span>
          </div>
          <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${sorted.length}, minmax(0, 1fr))` }}>
            {sorted.map((im, i) => (
              <button
                type="button"
                key={i}
                onClick={() => { seek(im.startSec); setManual(i); }}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-[12px] border-2 px-1 py-1.5 text-[12px] leading-tight font-semibold transition",
                  i === active ? "border-primary bg-primary-soft text-primary-deep" : "border-line-2 bg-surface text-ink-2 hover:border-primary-mid",
                )}
              >
                <span className="tabular-nums">{formatDuration(im.startSec)}</span>
                <span className="line-clamp-1">{im.caption || `Rasm ${i + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {broken ? (
        <div role="alert" className="bubble-in flex items-center gap-2 self-start bg-danger-soft px-4 py-3 text-[15px] font-semibold text-danger-ink">Audio yuklanmadi. Internetni tekshirib, sahifani yangilang.</div>
      ) : null}

      {!audioUrl && !sorted.length ? (
        <div className="bubble-in flex items-center gap-2 self-start bg-surface px-4 py-3 text-[15px] text-muted"><RotateCcw className="size-4" /> Tushuntirish hali yuklanmagan</div>
      ) : null}
    </div>
  );
}
