import Link from "next/link";
import { cn } from "@/lib/utils";

const BUBBLE = "M344 220h336c92.8 0 168 75.2 168 168v176c0 92.8-75.2 168-168 168H460L268 846c-12 8.6-28.8 0-28.8-14.8V700c-39-30-63.2-77-63.2-136V388c0-92.8 75.2-168 168-168z";
const BARS = [130, 250, 366, 236, 118];

/** ovoza mark: a voice message — speech bubble with a waveform. Same geometry as public/brand/ovoza-mark.svg. */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const tile = tone === "dark" ? "#0E4A40" : "#D4F04F";
  const fg = tone === "dark" ? "#D4F04F" : "#0E4A40";
  return (
    <svg viewBox="0 0 1024 1024" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="1024" height="1024" rx="232" fill={tile} />
      <path d={BUBBLE} fill={fg} />
      {BARS.map((h, i) => <rect key={i} x={312 + i * 100 - 26} y={470 - h / 2} width="52" height={h} rx="26" fill={tile} />)}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-display text-xl leading-none font-bold ", className)}>ovoza</span>;
}

export function Logo({ href = "/", className, suffix, tone = "dark" }: { href?: string; className?: string; suffix?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", tone === "dark" ? "text-ink" : "text-white", className)} aria-label="ovoza — bosh sahifa">
      <LogoMark tone={tone === "dark" ? "dark" : "light"} />
      <Wordmark />
      {suffix ? <span className="ml-0.5 rounded-md bg-ink px-1.5 py-0.5 text-xs font-bold tracking-widest text-white uppercase">{suffix}</span> : null}
    </Link>
  );
}

export function Waveform({ bars, progress = 0, played = "bg-white", rest = "bg-white/45", className }: { bars: number[]; progress?: number; played?: string; rest?: string; className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-8 min-w-0 flex-1 items-center gap-[2px]", className)}>
      {bars.map((h, i) => (
        <span key={i} className={cn("flex-1 rounded-full transition-colors", i / bars.length < progress ? played : rest)} style={{ height: `${Math.round(h * 100)}%` }} />
      ))}
    </span>
  );
}
