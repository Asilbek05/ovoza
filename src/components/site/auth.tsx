"use client";
import { useActionState, useState } from "react";
import { GraduationCap, Presentation } from "lucide-react";
import { login, register } from "@/app/(site)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return p.join(" ");
}

export function AuthCard({ mode, next, children }: { mode: "login" | "register"; next?: string; children?: React.ReactNode }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : register, null);
  const [phone, setPhone] = useState("");
  const [aud, setAud] = useState<"teacher" | "applicant">("teacher");
  const err = (f: string) => (state && !state.ok && (state.field === f || (!state.field && f === "password")) ? state.error : undefined);
  return (
    <div className="container-page flex min-h-[70vh] justify-center pt-8 pb-16 sm:pt-14">
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 shadow-float sm:p-9">
        <h1 className="t-h1">{mode === "login" ? "Xush kelibsiz" : "Roʻyxatdan oʻting"}</h1>
        <p className="mt-2 mb-7 text-base text-muted">{mode === "login" ? "Telefon raqamingiz va parolingiz bilan kiring." : "Natijalaringiz va ovozli tushuntirishlar saqlanib qoladi."}</p>
        <form action={action} className="space-y-4">
          <input type="hidden" name="next" value={next ?? ""} />
          {mode === "register" ? (
            <>
              <div role="radiogroup" aria-label="Siz kimsiz" className="grid grid-cols-2 gap-2">
                {([["teacher", "Oʻqituvchi", Presentation], ["applicant", "Abituriyent", GraduationCap]] as const).map(([k, label, Icon]) => (
                  <button key={k} type="button" role="radio" aria-checked={aud === k} onClick={() => setAud(k)} className={cn("flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition", aud === k ? "border-primary bg-primary-soft text-primary-deep" : "border-line hover:border-primary-mid")}>
                    <Icon className="size-5" /> {label}
                  </button>
                ))}
              </div>
              <input type="hidden" name="audience" value={aud} />
              <Field label="Ismingiz" htmlFor="name" error={err("name")}><Input id="name" name="name" autoComplete="name" required className="h-12 text-base" /></Field>
            </>
          ) : null}
          <Field label="Telefon raqami" htmlFor="phone" error={err("phone")}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-base font-semibold text-ink-2">+998</span>
              <Input id="phone" name="phone" inputMode="tel" autoComplete="tel-national" required placeholder="90 123 45 67" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="h-12 pl-[68px] text-base tabular-nums" />
            </div>
          </Field>
          <Field label="Parol" htmlFor="password" error={err("password")} hint={mode === "register" ? "Kamida 6 belgi" : undefined}>
            <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 6 : undefined} className="h-12 text-base" />
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>{pending ? "Kuting…" : mode === "login" ? "Kirish" : "Roʻyxatdan oʻtish"}</Button>
        </form>
        {children}
      </div>
    </div>
  );
}
