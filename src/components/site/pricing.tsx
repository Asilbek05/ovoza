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
      <div role="tablist" aria-label="Kim uchun" className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-line bg-surface p-1 sm:inline-grid sm:w-auto sm:self-start">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={cn("h-11 rounded-xl px-2 text-sm font-semibold transition sm:px-5", tab === t.key ? "bg-ink text-white" : "text-ink-2 hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      <div className={cn("grid gap-5", list.length >= 3 ? "lg:grid-cols-3" : list.length === 2 ? "md:grid-cols-2" : "max-w-md")}>
        {list.map((p) => {
          const hi = p.isHighlighted;
          return (
            <div key={p.id} className={cn("relative flex flex-col gap-5 rounded-3xl p-7", hi ? "bg-primary-deep text-white shadow-float" : "border border-line bg-surface")}>
              {hi ? <span className="absolute -top-3.5 right-7 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-ink">eng qulay</span> : null}
              <span className={cn("text-sm font-semibold", hi ? "text-white/80" : "text-muted")}>{p.name}</span>
              <span className="font-display text-4xl leading-none font-bold ">
                {formatPrice(p.priceUzs)}
                {p.priceNote ? <span className={cn("mt-2 block font-sans text-sm font-semibold tracking-normal", hi ? "text-white/80" : "text-muted")}>{p.priceNote}</span> : null}
              </span>
              <ul className="flex flex-1 flex-col gap-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm"><Check className={cn("mt-0.5 size-[18px] shrink-0", hi ? "text-accent" : "text-primary")} strokeWidth={2.6} />{f}</li>
                ))}
              </ul>
              <form action={createOrder.bind(null, p.id)}>
                <Button type="submit" size="lg" variant={hi ? "accent" : "soft"} className="w-full">Tanlash</Button>
              </form>
            </div>
          );
        })}
      </div>
      <p className="text-sm text-muted">Birinchi demo test bepul — 3 ta xatoning ovozli tahlili bilan. Toʻlov Click va Payme orqali tez orada ulanadi; hozircha buyurtma berasiz, toʻlov tasdiqlangach obuna ochiladi.</p>
    </div>
  );
}
