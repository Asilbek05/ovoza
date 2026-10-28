import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ovoza mark: a voice source (the “o”) with two concentric sound arcs.
 * Same geometry as src/app/icon.svg — keep them in sync.
 */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const bg = tone === "dark" ? "#0E4A40" : "#D4F04F";
  const fg = tone === "dark" ? "#D4F04F" : "#0E4A40";
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="18" fill={bg} />
      <g transform="translate(1.25 0)" fill="none" stroke={fg} strokeLinecap="round" strokeWidth="4.5">
        <circle cx="22" cy="32" r="8.5" fill={fg} stroke="none" />
        <path d="M35 21.1A17 17 0 0 1 35 42.9" />
        <path d="M41.9 15.3A26 26 0 0 1 41.9 48.7" opacity=".5" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("font-display text-[26px] leading-none font-extrabold tracking-[-0.045em]", className)}>ovoza</span>;
}

export function Logo({ href = "/", className, suffix, tone = "dark" }: { href?: string; className?: string; suffix?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", tone === "dark" ? "text-ink" : "text-white", className)} aria-label="ovoza — bosh sahifa">
      <LogoMark tone={tone === "dark" ? "dark" : "light"} />
      <Wordmark />
      {suffix ? <span className="ml-0.5 rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-white uppercase">{suffix}</span> : null}
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
