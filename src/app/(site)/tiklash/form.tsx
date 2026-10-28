"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { confirmReset, requestResetCode, type ResetResult } from "@/app/(site)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const fmt = (v: string) => {
  const d = v.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(" ");
};

export function ResetForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<ResetResult | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      if (step === 1) {
        const r = await requestResetCode(phone);
        setMsg(r);
        if (r.ok) setStep(2);
      } else {
        const r = await confirmReset(phone, code, pw);
        setMsg(r);
        if (r.ok) setTimeout(() => router.push("/kirish"), 1400);
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Telefon raqami" htmlFor="phone">
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-base font-semibold text-ink-2">+998</span>
          <Input id="phone" inputMode="tel" autoComplete="tel-national" required disabled={step === 2} placeholder="90 123 45 67" value={phone} onChange={(e) => setPhone(fmt(e.target.value))} className="h-12 pl-[68px] text-base tabular-nums" />
        </div>
      </Field>
      {step === 2 ? (
        <>
          <Field label="SMS kod" htmlFor="code"><Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="h-12 text-center font-display text-2xl tracking-[0.4em]" /></Field>
          <Field label="Yangi parol" htmlFor="pw" hint="Kamida 6 belgi"><Input id="pw" type="password" autoComplete="new-password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 text-base" /></Field>
        </>
      ) : null}
      {msg ? (
        <div role="status" className={cn("rounded-[14px] px-4 py-3 text-[15px] font-semibold", msg.ok ? "bg-success-soft text-success-ink" : "bg-danger-soft text-danger-ink")}>
          {msg.message}
          {msg.devCode ? <span className="mt-1 block font-display text-2xl tracking-[0.3em]">{msg.devCode}</span> : null}
        </div>
      ) : null}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? "Kuting…" : step === 1 ? "Kod yuborish" : "Parolni yangilash"}</Button>
      {step === 2 ? <button type="button" onClick={() => { setStep(1); setMsg(null); setCode(""); }} className="w-full text-center text-[15px] font-semibold text-muted hover:text-ink">Raqamni oʻzgartirish</button> : null}
    </form>
  );
}
