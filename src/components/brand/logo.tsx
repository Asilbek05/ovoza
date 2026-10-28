import Link from "next/link";
import { cn } from "@/lib/utils";

/*
 * ovoza identity — custom monoline lettering (x-height 300, stroke 64, round caps).
 * The dot inside the second "o" is the voice. Geometry is shared with public/brand/ovoza-logo.svg.
 */
const R = 118;
const INK = { dark: { ink: "#0E4A40", dot: "#98BF14" }, light: { ink: "#FFFFFF", dot: "#D4F04F" } } as const;

/** "ov" monogram: the ring with the voice dot, plus the v. */
export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const c = INK[tone];
  return (
    <svg viewBox="-30 -30 704 360" className={cn("h-8 w-auto shrink-0", className)} aria-hidden>
      <g fill="none" stroke={c.ink} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="150" r={R} />
        <path d="M376 32L494 268L612 32" />
      </g>
      <circle cx="150" cy="150" r="56" fill={c.dot} />
    </svg>
  );
}

export function Wordmark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const c = INK[tone];
  return (
    <svg viewBox="-8 -8 1662 316" role="img" aria-label="ovoza" className={cn("h-[22px] w-auto", className)}>
      <g fill="none" stroke={c.ink} strokeWidth="64" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="150" cy="150" r={R} />
        <path d="M376 32L494 268L612 32" />
        <circle cx="828" cy="150" r={R} />
        <path d="M1054 32H1270L1054 268H1270" />
        <circle cx="1496" cy="150" r={R} />
        <path d="M1616 32V268" />
      </g>
      <circle cx="828" cy="150" r="56" fill={c.dot} />
    </svg>
  );
}

export function Logo({ href = "/", className, suffix, tone = "dark" }: { href?: string; className?: string; suffix?: string; tone?: "dark" | "light" }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="ovoza — bosh sahifa">
      <Wordmark tone={tone} />
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
