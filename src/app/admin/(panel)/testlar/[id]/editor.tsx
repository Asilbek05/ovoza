"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, AudioLines, Check, ImageIcon, Pencil, Plus, Sparkles, Trash2, Upload, Shuffle } from "lucide-react";
import type { ExamType, Question, Subject, Test } from "@/db/schema";
import { deleteQuestion, deleteTest, moveQuestion, saveQuestion, saveTest } from "../../../actions";
import { useRun } from "@/components/admin/use-run";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SubjectSelect } from "../client";
import { cn } from "@/lib/utils";

type Status = Record<number, { audio: boolean; images: number; similar: boolean }>;
const L = "ABCDEF";

export function QuestionForm({ value, onChange }: { value: { text: string; options: string[]; correctIndex: number; topic: string }; onChange: (v: { text: string; options: string[]; correctIndex: number; topic: string }) => void }) {
  const v = value;
  return (
    <div className="space-y-4">
      <Field label="Savol matni"><Textarea rows={3} value={v.text} onChange={(e) => onChange({ ...v, text: e.target.value })} /></Field>
      <div>
        <span className="mb-1.5 block text-sm font-semibold text-ink-2">Variantlar — toʻgʻrisini belgilang</span>
        <div className="space-y-2">
          {v.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...v, correctIndex: i })}
                aria-label={`${L[i]} toʻgʻri javob`}
                aria-pressed={v.correctIndex === i}
                className={cn("flex size-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition", v.correctIndex === i ? "border-success bg-success text-white" : "border-line bg-bg text-ink-2 hover:border-success")}
              >
                {v.correctIndex === i ? <Check className="size-5" /> : L[i]}
              </button>
              <Input value={o} onChange={(e) => onChange({ ...v, options: v.options.map((x, j) => (j === i ? e.target.value : x)) })} />
              {v.options.length > 2 ? (
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Variantni oʻchirish" onClick={() => onChange({ ...v, options: v.options.filter((_, j) => j !== i), correctIndex: v.correctIndex === i ? 0 : v.correctIndex > i ? v.correctIndex - 1 : v.correctIndex })}><Trash2 /></Button>
              ) : null}
            </div>
          ))}
        </div>
        {v.options.length < 6 ? <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => onChange({ ...v, options: [...v.options, ""] })}><Plus /> Variant qoʻshish</Button> : null}
      </div>
      <Field label="Mavzu" hint="Natijadagi mavzular xaritasi shu nom boʻyicha tuziladi"><Input value={v.topic} placeholder="Kvadrat tenglamalar" onChange={(e) => onChange({ ...v, topic: e.target.value })} /></Field>
    </div>
  );
}

export function TestEditor({ test, examTypes, subjects, questions, status }: { test: Test; examTypes: ExamType[]; subjects: Subject[]; questions: Question[]; status: Status }) {
  const router = useRouter();
  const { run, pending } = useRun();
  const [meta, setMeta] = useState({ subjectId: test.subjectId as number | "", title: test.title, description: test.description, durationMin: test.durationMin, isFree: test.isFree, isPublished: test.isPublished });
  const [q, setQ] = useState<null | { id?: number; text: string; options: string[]; correctIndex: number; topic: string }>(null);
  const missingAudio = questions.filter((x) => !status[x.id]?.audio).length;

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_360px]">
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Savollar <span className="text-muted">{questions.length}</span></h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="soft"><Link href={`/admin/testlar/${test.id}/import`}><Sparkles /> AI import</Link></Button>
            <Button variant="primary" onClick={() => setQ({ text: "", options: ["", "", "", ""], correctIndex: 0, topic: "" })}><Plus /> Savol</Button>
          </div>
        </div>
        {missingAudio > 0 && questions.length > 0 ? (
          <p className="rounded-2xl bg-accent-soft px-4 py-3 text-[15px] font-medium text-accent-ink"><b className="font-bold">{missingAudio} ta savolda audio yoʻq.</b> Ustozlar bergan audiolarni savol ustiga bosib yuklang.</p>
        ) : null}
        {questions.length === 0 ? (
          <EmptyState icon={<Upload className="size-6" />} title="Hali savol yoʻq" text="Savollarni Word, PDF yoki matndan AI orqali import qiling yoki qoʻlda qoʻshing." action={<Button asChild variant="primary"><Link href={`/admin/testlar/${test.id}/import`}><Sparkles /> AI import</Link></Button>} />
        ) : (
          <ol className="space-y-2.5">
            {questions.map((x, i) => {
              const st = status[x.id];
              return (
                <li key={x.id}>
                  <Card className="flex flex-wrap gap-3 p-4 sm:flex-nowrap sm:p-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-display font-bold text-primary-deep">{i + 1}</span>
                    <div className="min-w-0 flex-1 basis-[calc(100%-52px)] sm:basis-0">
                      <p className="text-[15px] leading-relaxed font-semibold whitespace-pre-line">{x.text}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {x.options.map((o, j) => (
                          <span key={j} className={cn("rounded-full px-3 py-1 text-[13px] font-medium", j === x.correctIndex ? "bg-success-soft font-bold text-success-ink" : "bg-bg text-ink-2")}>{L[j]}) {o}</span>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {x.topic ? <Badge tone="gray">{x.topic}</Badge> : null}
                        <Badge tone={st?.audio ? "green" : "red"}><AudioLines className="size-3.5" />{st?.audio ? "audio bor" : "audio yoʻq"}</Badge>
                        <Badge tone={st?.images ? "blue" : "gray"}><ImageIcon className="size-3.5" />{st?.images ?? 0} rasm</Badge>
                        <Badge tone={st?.similar ? "blue" : "gray"}><Shuffle className="size-3.5" />{st?.similar ? "oʻxshash savol" : "oʻxshash yoʻq"}</Badge>
                      </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-between gap-1 border-t border-line-2 pt-2 sm:w-auto sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <Button asChild variant={st?.audio ? "soft" : "primary"} size="sm"><Link href={`/admin/savollar/${x.id}`}><AudioLines /> Tushuntirish</Link></Button>
                      <div className="flex">
                        <Button variant="ghost" size="icon-sm" aria-label="Yuqoriga" disabled={i === 0} onClick={() => run(() => moveQuestion(x.id, -1))}><ArrowUp /></Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Pastga" disabled={i === questions.length - 1} onClick={() => run(() => moveQuestion(x.id, 1))}><ArrowDown /></Button>
                        <Button variant="ghost" size="icon-sm" aria-label="Tahrirlash" onClick={() => setQ({ id: x.id, text: x.text, options: x.options, correctIndex: x.correctIndex, topic: x.topic ?? "" })}><Pencil /></Button>
                        <Confirm title="Savolni oʻchirasizmi?" description="Uning audio tushuntirishi ham oʻchadi." onConfirm={async () => { await run(() => deleteQuestion(x.id), "Savol oʻchirildi"); }} trigger={<Button variant="ghost" size="icon-sm" aria-label="Oʻchirish" className="text-danger-ink hover:bg-danger-soft hover:text-danger-ink"><Trash2 /></Button>} />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <Card className="space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Test sozlamalari</h2>
          <Field label="Fan"><SubjectSelect examTypes={examTypes} subjects={subjects} value={meta.subjectId} onChange={(v) => setMeta({ ...meta, subjectId: v })} /></Field>
          <Field label="Nomi"><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></Field>
          <Field label="Tavsif"><Textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></Field>
          <Field label="Vaqt (daqiqa)"><Input type="number" min={1} value={meta.durationMin} onChange={(e) => setMeta({ ...meta, durationMin: Number(e.target.value) })} /></Field>
          <label className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[15px] font-semibold">Bepul <Switch checked={meta.isFree} onCheckedChange={(v) => setMeta({ ...meta, isFree: v })} /></label>
          <label className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[15px] font-semibold">Saytda chop etilgan <Switch checked={meta.isPublished} onCheckedChange={(v) => setMeta({ ...meta, isPublished: v })} /></label>
          <Button className="w-full" disabled={pending} onClick={() => run(() => saveTest({ id: test.id, ...meta, subjectId: Number(meta.subjectId) }), "Saqlandi")}>Saqlash</Button>
        </Card>
        <Confirm
          title="Testni oʻchirasizmi?"
          description={`${questions.length} ta savol va ularning tushuntirishlari ham oʻchadi.`}
          onConfirm={async () => { const r = await run(() => deleteTest(test.id), "Test oʻchirildi"); if (r.ok) router.push("/admin/testlar"); }}
          trigger={<Button variant="danger-soft" className="w-full"><Trash2 /> Testni oʻchirish</Button>}
        />
      </aside>

      <Dialog open={!!q} onOpenChange={(o) => !o && setQ(null)}>
        <DialogContent className="max-w-2xl">
          {q ? (
            <>
              <DialogHeader><DialogTitle>{q.id ? "Savolni tahrirlash" : "Yangi savol"}</DialogTitle></DialogHeader>
              <QuestionForm value={q} onChange={setQ} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setQ(null)}>Bekor qilish</Button>
                <Button disabled={pending} onClick={async () => { const r = await run(() => saveQuestion({ ...q, testId: test.id, topic: q.topic || null }), "Savol saqlandi"); if (r.ok) setQ(null); }}>Saqlash</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
