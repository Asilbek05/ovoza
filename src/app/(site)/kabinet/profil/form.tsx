"use client";
import { useActionState, useState } from "react";
import { GraduationCap, Presentation } from "lucide-react";
import { changePassword, updateProfile } from "@/app/(site)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function Msg({ s }: { s: { ok: boolean; message: string } | null }) {
  if (!s) return null;
  return <p role="status" className={cn("text-sm font-semibold", s.ok ? "text-success-ink" : "text-danger-ink")}>{s.message}</p>;
}

export function ProfileForms({ name, audience, phone }: { name: string; audience: "teacher" | "applicant"; phone: string }) {
  const [p, profileAction, profilePending] = useActionState(updateProfile, null);
  const [pw, pwAction, pwPending] = useActionState(changePassword, null);
  const [aud, setAud] = useState(audience);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <form action={profileAction} className="space-y-4 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="t-h3">Maʼlumotlar</h2>
        <Field label="Telefon raqami" hint="Raqamni almashtirish uchun administratorga yozing"><Input value={`+${phone}`} disabled className="h-12 text-base tabular-nums" readOnly /></Field>
        <Field label="Ismingiz" htmlFor="name"><Input id="name" name="name" defaultValue={name} required className="h-12 text-base" autoComplete="name" /></Field>
        <div role="radiogroup" aria-label="Siz kimsiz" className="grid grid-cols-2 gap-2">
          {([["teacher", "Oʻqituvchi", Presentation], ["applicant", "Abituriyent", GraduationCap]] as const).map(([k, label, Icon]) => (
            <button key={k} type="button" role="radio" aria-checked={aud === k} onClick={() => setAud(k)} className={cn("flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-sm font-bold transition", aud === k ? "border-primary bg-primary-soft text-primary-deep" : "border-line hover:border-primary-mid")}><Icon className="size-5" /> {label}</button>
          ))}
        </div>
        <input type="hidden" name="audience" value={aud} />
        <Msg s={p} />
        <Button type="submit" variant="primary" size="lg" disabled={profilePending}>{profilePending ? "Saqlanmoqda…" : "Saqlash"}</Button>
      </form>

      <form action={pwAction} className="space-y-4 rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="t-h3">Parolni almashtirish</h2>
        <Field label="Joriy parol" htmlFor="current"><Input id="current" name="current" type="password" autoComplete="current-password" required className="h-12 text-base" /></Field>
        <Field label="Yangi parol" htmlFor="next" hint="Kamida 6 belgi"><Input id="next" name="next" type="password" autoComplete="new-password" minLength={6} required className="h-12 text-base" /></Field>
        <Msg s={pw} />
        <Button type="submit" variant="soft" size="lg" disabled={pwPending}>{pwPending ? "Kuting…" : "Parolni yangilash"}</Button>
      </form>
    </div>
  );
}
