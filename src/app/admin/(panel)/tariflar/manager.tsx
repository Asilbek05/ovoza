"use client";
import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import type { Plan } from "@/db/schema";
import { deletePlan, savePlan } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/misc";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, formatPrice, slugify } from "@/lib/utils";

const AUD = { all: "Hamma", teacher: "Oʻqituvchilar", applicant: "Abituriyentlar", school: "Maktablar" } as const;
type Aud = keyof typeof AUD;
type F = { id?: number; code: string; name: string; audience: Aud; priceUzs: number; priceNote: string; periodDays: number | null; testsLimit: number | null; features: string; isHighlighted: boolean; isActive: boolean; sort: number };

export function PlansManager({ plans }: { plans: Plan[] }) {
  const [f, setF] = useState<F | null>(null);
  const { run, pending } = useRun();
  const groups = (Object.keys(AUD) as Aud[]).map((a) => ({ a, items: plans.filter((p) => p.audience === a) })).filter((g) => g.items.length);
  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button variant="primary" onClick={() => setF({ code: "", name: "", audience: "teacher", priceUzs: 0, priceNote: "", periodDays: 30, testsLimit: null, features: "", isHighlighted: false, isActive: true, sort: plans.length + 1 })}><Plus /> Tarif qoʻshish</Button>
      </div>
      <div className="space-y-7">
        {groups.map(({ a, items }) => (
          <section key={a}>
            <h2 className="mb-3 font-display text-xl font-bold">{AUD[a]}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <Card key={p.id} className={cn("flex flex-col gap-3 p-5", p.isHighlighted && "border-primary ring-2 ring-primary/15", !p.isActive && "opacity-60")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-bold">{p.name}</h3>
                      <p className="font-display text-2xl font-extrabold">{formatPrice(p.priceUzs)} <span className="text-sm font-semibold text-muted">{p.priceNote}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {p.isHighlighted ? <Badge tone="solid"><Star className="size-3.5" /> asosiy</Badge> : null}
                      {!p.isActive ? <Badge tone="gray">nofaol</Badge> : null}
                    </div>
                  </div>
                  <p className="text-[13px] font-semibold text-muted">{p.periodDays ? `${p.periodDays} kun` : "Bir martalik"}{p.testsLimit ? ` · ${p.testsLimit} ta test` : ""}</p>
                  <ul className="flex-1 space-y-1 text-[14px] text-ink-2">{p.features.map((x) => <li key={x}>• {x}</li>)}</ul>
                  <div className="flex justify-end gap-1 border-t border-line-2 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => setF({ ...p, audience: p.audience as Aud, features: p.features.join("\n") })}><Pencil /> Tahrirlash</Button>
                    <Confirm title={`«${p.name}» tarifini oʻchirasizmi?`} onConfirm={async () => { await run(() => deletePlan(p.id), "Tarif oʻchirildi"); }} trigger={<Button variant="ghost" size="icon-sm" aria-label="Oʻchirish" className="text-danger-ink hover:bg-danger-soft"><Trash2 /></Button>} />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent className="max-w-xl">
          {f ? (
            <>
              <DialogHeader><DialogTitle>{f.id ? "Tarifni tahrirlash" : "Yangi tarif"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nomi" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, code: f.id ? f.code : slugify(`${f.audience}-${e.target.value}`) })} /></Field>
                <Field label="Kim uchun"><NativeSelect value={f.audience} onChange={(e) => setF({ ...f, audience: e.target.value as Aud })}>{(Object.keys(AUD) as Aud[]).map((k) => <option key={k} value={k}>{AUD[k]}</option>)}</NativeSelect></Field>
                <Field label="Narx (soʻm)"><Input type="number" min={0} step={1000} value={f.priceUzs} onChange={(e) => setF({ ...f, priceUzs: Number(e.target.value) })} /></Field>
                <Field label="Narx yonidagi izoh" hint="/ oy, ~18% arzon…"><Input value={f.priceNote} onChange={(e) => setF({ ...f, priceNote: e.target.value })} /></Field>
                <Field label="Muddat (kun)" hint="Boʻsh = bir martalik"><Input type="number" min={1} value={f.periodDays ?? ""} onChange={(e) => setF({ ...f, periodDays: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Testlar soni" hint="Boʻsh = cheksiz"><Input type="number" min={1} value={f.testsLimit ?? ""} onChange={(e) => setF({ ...f, testsLimit: e.target.value ? Number(e.target.value) : null })} /></Field>
                <Field label="Tartib"><Input type="number" min={0} value={f.sort} onChange={(e) => setF({ ...f, sort: Number(e.target.value) })} /></Field>
                <Field label="Imkoniyatlar (har biri yangi qatorda)" className="sm:col-span-2"><Textarea rows={4} value={f.features} onChange={(e) => setF({ ...f, features: e.target.value })} /></Field>
                <label className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[15px] font-semibold">Ajratib koʻrsatish <Switch checked={f.isHighlighted} onCheckedChange={(v) => setF({ ...f, isHighlighted: v })} /></label>
                <label className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[15px] font-semibold">Faol <Switch checked={f.isActive} onCheckedChange={(v) => setF({ ...f, isActive: v })} /></label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setF(null)}>Bekor qilish</Button>
                <Button disabled={pending} onClick={async () => {
                  const r = await run(() => savePlan({ ...f, code: f.code || slugify(`${f.audience}-${f.name}`), features: f.features.split("\n").map((x) => x.trim()).filter(Boolean) }), "Tarif saqlandi");
                  if (r.ok) setF(null);
                }}>Saqlash</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
