import * as React from "react";
import { cn } from "@/lib/utils";

const badgeTones = {
  blue: "bg-primary-soft text-primary-deep",
  yellow: "bg-accent-soft text-accent-ink",
  green: "bg-success-soft text-success-ink",
  red: "bg-danger-soft text-danger-ink",
  gray: "bg-[#EEF2F8] text-ink-2",
  solid: "bg-primary text-white",
};
export function Badge({ tone = "blue", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold whitespace-nowrap", badgeTones[tone], className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[28px] border border-line bg-surface", className)} {...props} />;
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[15px]", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("border-b border-line px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-muted", className)} {...props} />;
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-line-2 px-4 py-3 align-middle", className)} {...props} />;
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[28px] border border-dashed border-primary-mid/60 bg-surface px-6 py-14 text-center">
      {icon ? <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">{icon}</div> : null}
      <p className="font-display text-xl font-bold">{title}</p>
      {text ? <p className="max-w-md text-[15px] text-muted">{text}</p> : null}
      {action}
    </div>
  );
}
