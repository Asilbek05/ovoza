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
  coral: { bg: "bg-danger-soft", icon: "bg-danger text-white", text: "text-danger-ink" },
  violet: { bg: "bg-[#EEE8FF]", icon: "bg-[#6A4FD8] text-white", text: "text-[#4B36A8]" },
  teal: { bg: "bg-[#DDF3F5]", icon: "bg-[#0F7C86] text-white", text: "text-[#0B5E66]" },
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
