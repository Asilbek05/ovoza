import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("logo-bubble inline-flex size-9 items-center justify-center bg-primary", className)}>
      <svg viewBox="0 0 24 24" className="size-[40%] fill-white" aria-hidden><path d="M8 5v14l11-7z" /></svg>
    </span>
  );
}

export function Logo({ href = "/", className, suffix }: { href?: string; className?: string; suffix?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 text-ink", className)} aria-label="tushun. bosh sahifa">
      <LogoMark />
      <span className="font-display text-[24px] leading-none font-extrabold tracking-tight">
        tushun<span className="text-[#F2B400]">.</span>
      </span>
      {suffix ? <span className="ml-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase">{suffix}</span> : null}
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
