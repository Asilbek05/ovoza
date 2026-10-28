import { Award, FileText, GraduationCap, type LucideIcon } from "lucide-react";

export const EXAM_ICON: Record<string, LucideIcon> = { attestatsiya: Award, "milliy-sertifikat": FileText, dtm: GraduationCap };
export const EXAM_TONE: Record<string, { card: string; icon: string; link: string }> = {
  attestatsiya: { card: "bg-primary-soft", icon: "bg-primary text-white", link: "text-primary" },
  "milliy-sertifikat": { card: "bg-accent-soft", icon: "bg-ink text-white", link: "text-accent-ink" },
  dtm: { card: "bg-[#ece8f7]", icon: "bg-[#5b49a8] text-white", link: "text-[#43357f]" },
};
