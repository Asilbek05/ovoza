import { Award, FileText, GraduationCap, type LucideIcon } from "lucide-react";

export const EXAM_ICON: Record<string, LucideIcon> = { attestatsiya: Award, "milliy-sertifikat": FileText, dtm: GraduationCap };
export const EXAM_TONE: Record<string, { card: string; icon: string; link: string }> = {
  attestatsiya: { card: "bg-primary-soft", icon: "bg-primary text-accent", link: "text-primary" },
  "milliy-sertifikat": { card: "bg-accent-soft", icon: "bg-ink text-accent", link: "text-accent-ink" },
  dtm: { card: "bg-[#dff1f4]", icon: "bg-[#1b7f93] text-white", link: "text-[#13596a]" },
};
