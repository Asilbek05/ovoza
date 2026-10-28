import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * ovoza mark: two chat bubbles that read as "oo" — a question and an answer.
 * Where they overlap (the lime lens) is understanding. Same geometry as public/brand/ovoza-mark.svg.
 */
const BLEFT = "M117 740V470A270 270 0 1 1 387 740Z";
const BRIGHT = "M907 740H637A270 270 0 1 1 907 470Z";

export function LogoMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const id = tone === "dark" ? "lmd" : "lml";
  const [a, b, lens] = tone === "dark" ? ["#0E4A40", "#1F7C64", "#D4F04F"] : ["#D4F04F", "#FFFFFF", null];
  return (
    <svg viewBox="77 160 870 620" className={cn("h-9 w-auto shrink-0", className)} aria-hidden>
      <defs>
        <clipPath id={`${id}c`}><path d={BRIGHT} /></clipPath>
        <mask id={`${id}l`}><rect x="0" y="0" width="1024" height="1024" fill="#fff" /><path d={BRIGHT} fill="#000" /></mask>
        <mask id={`${id}r`}><rect x="0" y="0" width="1024" height="1024" fill="#fff" /><path d={BLEFT} fill="#000" /></mask>
      </defs>
      <path d={BLEFT} fill={a} mask={`url(#${id}l)`} />
      <path d={BRIGHT} fill={b} mask={`url(#${id}r)`} />
      {lens ? <path d={BLEFT} fill={lens} clipPath={`url(#${id}c)`} /> : null}
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
