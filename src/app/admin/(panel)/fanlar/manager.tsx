"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { ExamType, Subject } from "@/db/schema";
import { deleteSubject, saveSubject, toggleSubject } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { SUBJECT_COLORS, SUBJECT_COLOR_NAMES, cn, slugify, type SubjectColor } from "@/lib/utils";

type Row = Subject & { tests: number };
type Form = { id?: number; name: string; slug: string; color: SubjectColor; isActive: boolean; sort: number };

export function SubjectsManager({ examTypes, rows, initialTab }: { examTypes: ExamType[]; rows: Row[]; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab ?? "");
  const [form, setForm] = useState<Form | null>(null);
  const { run, pending } = useRun();
  const current = examTypes.find((e) => e.slug === tab);
  const list = useMemo(() => rows.filter((r) => r.examTypeId === current?.id), [rows, current]);

  const openNew = () => setForm({ name: "", slug: "", color: "blue", isActive: true, sort: (list.at(-1)?.sort ?? 0) + 1 });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {examTypes.map((e) => (
              <TabsTrigger key={e.id} value={e.slug}>
                {e.name} <span className="ml-1.5 opacity-70">{rows.filter((r) => r.examTypeId === e.id).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="primary" onClick={openNew}><Plus /> Fan qoʻshish</Button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<BookOpen className="size-6" />} title="Bu boʻlimda hali fan yoʻq" text="Birinchi fanni qoʻshing — keyin uning ichida testlar yaratasiz." action={<Button variant="primary" onClick={openNew}><Plus /> Fan qoʻshish</Button>} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const c = SUBJECT_COLORS[(r.color as SubjectColor) in SUBJECT_COLORS ? (r.color as SubjectColor) : "blue"];
            return (
              <Card key={r.id} className={cn("flex flex-col gap-4 p-5 transition", !r.isActive && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl font-display text-lg font-bold", c.icon)}>{r.name.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate t-h3">{r.name}</h3>
                    <Link href={`/admin/testlar?fan=${r.id}`} className="text-sm font-semibold text-primary hover:underline">{r.tests} ta test</Link>
                  </div>
                  <Switch checked={r.isActive} aria-label="Faol" onCheckedChange={(v) => run(() => toggleSubject(r.id, v), v ? "Fan yoqildi" : "Fan oʻchirib qoʻyildi")} />
                </div>
                <div className="flex items-center justify-between border-t border-line-2 pt-3">
                  <span className="text-xs font-semibold text-muted">/{current?.slug}/{r.slug} · tartib {r.sort}</span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => setForm({ id: r.id, name: r.name, slug: r.slug, color: r.color as SubjectColor, isActive: r.isActive, sort: r.sort })}><Pencil /></Button>
                    <Confirm
                      title={`«${r.name}» fanini oʻchirasizmi?`}
                      description={r.tests ? `Uning ${r.tests} ta testi va barcha savollari ham oʻchadi.` : "Bu amalni qaytarib boʻlmaydi."}
                      onConfirm={async () => { await run(() => deleteSubject(r.id), "Fan oʻchirildi"); }}
                      trigger={<Button variant="ghost" size="icon-sm" aria-label="Oʻchirish" className="text-danger-ink hover:bg-danger-soft hover:text-danger-ink"><Trash2 /></Button>}
                    />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent>
          {form ? (
            <>
              <DialogHeader>
                <DialogTitle>{form.id ? "Fanni tahrirlash" : "Yangi fan"}</DialogTitle>
                <DialogDescription>{current?.name} boʻlimi</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Fan nomi" htmlFor="sname">
                  <Input id="sname" autoFocus value={form.name} placeholder="Masalan: Musiqa madaniyati" onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.id ? form.slug : slugify(e.target.value) })} />
                </Field>
                <Field label="Manzil (slug)" hint={`Sayt manzili: /imtihon/${current?.slug}/${form.slug || "…"}`}>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
                </Field>
                <div>
                  <span className="mb-1.5 block text-sm font-semibold text-ink-2">Rang</span>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rang">
                    {(Object.keys(SUBJECT_COLORS) as SubjectColor[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={form.color === k}
                        onClick={() => setForm({ ...form, color: k })}
                        className={cn("flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold", form.color === k ? "border-primary ring-2 ring-primary/25" : "border-line")}
                      >
                        <span className={cn("size-5 rounded-full", SUBJECT_COLORS[k].icon)} /> {SUBJECT_COLOR_NAMES[k]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tartib raqami"><Input type="number" min={0} value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} /></Field>
                  <label className="mt-7 flex h-11 items-center justify-between gap-2 rounded-xl bg-bg px-4 text-sm font-semibold">Faol <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /></label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setForm(null)}>Bekor qilish</Button>
                <Button
                  disabled={pending || !current}
                  onClick={async () => {
                    const r = await run(() => saveSubject({ ...form, examTypeId: current!.id }), form.id ? "Fan saqlandi" : "Fan qoʻshildi");
                    if (r.ok) setForm(null);
                  }}
                >
                  Saqlash
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
