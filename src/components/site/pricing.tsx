"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import type { Plan } from "@/db/schema";
import { createOrder } from "@/app/(site)/actions";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

const TABS = [
  { key: "teacher", label: "Oʻqituvchilar" },
  { key: "applicant", label: "Abituriyentlar" },
  { key: "school", label: "Maktablar" },
] as const;

export function Pricing({ plans }: { plans: Plan[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("teacher");
  const list = plans.filter((p) => p.audience === tab && p.isActive);
  return (
    <div className="flex flex-col gap-8">
      <div role="tablist" aria-label="Kim uchun" className="flex gap-1 self-start rounded-full border border-line bg-surface p-1">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cn("h-11 rounded-full px-4 text-[15px] font-semibold transition sm:px-5", tab === t.key ? "bg-primary text-white" : "text-ink-2 hover:text-primary-deep")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={cn("grid gap-5", list.length >= 3 ? "lg:grid-cols-3" : list.length === 2 ? "md:grid-cols-2" : "max-w-md")}>
        {list.map((p) => {
          const hi = p.isHighlighted;
          return (
            <div key={p.id} className={cn("relative flex flex-col gap-5 rounded-[32px] p-7", hi ? "bg-primary text-white shadow-[0_30px_60px_-30px_rgb(37_87_232/0.7)]" : "border border-line bg-surface")}>
              {hi ? <span className="absolute -top-3.5 right-7 rotate-3 rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-bold text-ink">eng qulay</span> : null}
              <span className={cn("text-[15px] font-semibold", hi ? "text-white/80" : "text-muted")}>{p.name}</span>
              <span className="font-display text-[40px] leading-none font-extrabold">
                {formatPrice(p.priceUzs)}
                {p.priceNote ? <span className={cn("ml-1.5 font-sans text-base font-semibold", hi ? "text-white/80" : "text-muted")}>{p.priceNote}</span> : null}
              </span>
              <ul className="flex flex-1 flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px]"><Check className={cn("mt-0.5 size-[18px] shrink-0", hi ? "text-accent" : "text-success")} strokeWidth={2.6} />{f}</li>
                ))}
              </ul>
              <form action={createOrder.bind(null, p.id)}>
                <Button type="submit" size="lg" variant={hi ? "outline" : "soft"} className={cn("w-full", hi && "border-0 text-primary-deep")}>Tanlash</Button>
              </form>
            </div>
          );
        })}
      </div>
      <p className="text-[15px] text-muted">Birinchi demo test bepul — 3 ta xatoning ovozli tahlili bilan. Toʻlov Click va Payme orqali tez orada ulanadi; hozircha buyurtma berasiz, toʻlov tasdiqlangach obuna ochiladi.</p>
    </div>
  );
}
