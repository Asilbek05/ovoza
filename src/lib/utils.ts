import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(uzs: number) {
  if (uzs === 0) return "Bepul";
  return `${uzs.toLocaleString("ru-RU").replace(/,/g, " ")} soʻm`;
}

export function formatDuration(sec: number | null | undefined) {
  if (!sec || sec < 0) return "0:00";
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[ʻʼ'`’]/g, "")
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Deterministic pseudo-waveform bar heights (0.18 – 1) for an id. */
export function waveform(count: number, seed = 1) {
  return Array.from({ length: count }, (_, i) => {
    const v = Math.abs(Math.sin((i + seed) * 1.7) * 0.6 + Math.sin((i + seed) * 0.45) * 0.4);
    return 0.18 + v * 0.82;
  });
}

export const SUBJECT_COLORS = {
  blue: { bg: "bg-primary-soft", icon: "bg-primary text-white", text: "text-primary-deep" },
  yellow: { bg: "bg-accent-soft", icon: "bg-accent text-ink", text: "text-accent-ink" },
  green: { bg: "bg-success-soft", icon: "bg-success text-white", text: "text-success-ink" },
  coral: { bg: "bg-danger-soft", icon: "bg-[#ef7a5a] text-white", text: "text-danger-ink" },
  violet: { bg: "bg-[#fbe6f1]", icon: "bg-[#b0357f] text-white", text: "text-[#7e2058]" },
  teal: { bg: "bg-[#dff1f4]", icon: "bg-[#1b7f93] text-white", text: "text-[#13596a]" },
} as const;
export type SubjectColor = keyof typeof SUBJECT_COLORS;
export const SUBJECT_COLOR_NAMES: Record<SubjectColor, string> = {
  blue: "Koʻk",
  yellow: "Sariq",
  green: "Yashil",
  coral: "Qizgʻish",
  violet: "Binafsha",
  teal: "Feruza",
};

export function scoreLevel(pct: number) {
  if (pct >= 86) return { label: "Aʼlo", tone: "bg-success-soft text-success-ink", note: "Juda yaxshi natija. Qolgan xatolarni ham koʻrib chiqing." };
  if (pct >= 70) return { label: "Yaxshi", tone: "bg-primary-soft text-primary-deep", note: "Yaxshi tayyorgarlik. Zaif mavzularni mustahkamlang." };
  if (pct >= 50) return { label: "Oʻrtacha", tone: "bg-accent-soft text-accent-ink", note: "Xatolaringiz tahlili natijani tez oshiradi." };
  return { label: "Past", tone: "bg-danger-soft text-danger-ink", note: "Xavotir olmang — har bir xatoni tinglab chiqing, keyin qayta yeching." };
}

export function formatClock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} soat ${m} daq` : m ? `${m} daq ${s % 60} s` : `${s} s`;
}
