import { Award, FileText, GraduationCap, type LucideIcon } from "lucide-react";

export const EXAM_ICON: Record<string, LucideIcon> = { attestatsiya: Award, "milliy-sertifikat": FileText, dtm: GraduationCap };
export const EXAM_TONE: Record<string, { card: string; icon: string; link: string }> = {
  attestatsiya: { card: "bg-primary-soft", icon: "bg-primary text-white", link: "text-primary" },
  "milliy-sertifikat": { card: "bg-accent-soft", icon: "bg-accent text-ink", link: "text-accent-ink" },
  dtm: { card: "bg-success-soft", icon: "bg-success text-white", link: "text-success-ink" },
};
