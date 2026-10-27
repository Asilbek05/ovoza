"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import type { ExamType, Subject } from "@/db/schema";
import { saveTest } from "../../actions";
import { useRun } from "@/components/admin/use-run";
import { Button } from "@/components/ui/button";
import { NativeSelect, Field, Input, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export function TestFilters({ examTypes, subjects, tur, fan }: { examTypes: ExamType[]; subjects: Subject[]; tur?: string; fan?: string }) {
  const router = useRouter();
  const et = examTypes.find((e) => e.slug === tur);
  const subs = et ? subjects.filter((x) => x.examTypeId === et.id) : subjects;
  const go = (next: { tur?: string; fan?: string }) => {
    const p = new URLSearchParams();
    if (next.tur) p.set("tur", next.tur);
    if (next.fan) p.set("fan", next.fan);
    router.push(`/admin/testlar${p.size ? `?${p}` : ""}`);
  };
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
      <NativeSelect aria-label="Imtihon turi" value={tur ?? ""} onChange={(e) => go({ tur: e.target.value || undefined })}>
        <option value="">Barcha imtihon turlari</option>
        {examTypes.map((e) => <option key={e.id} value={e.slug}>{e.name}</option>)}
      </NativeSelect>
      <NativeSelect aria-label="Fan" value={fan ?? ""} onChange={(e) => go({ tur, fan: e.target.value || undefined })}>
        <option value="">Barcha fanlar</option>
        {subs.map((x) => <option key={x.id} value={x.id}>{et ? x.name : `${x.name} — ${examTypes.find((e) => e.id === x.examTypeId)?.name}`}</option>)}
      </NativeSelect>
    </div>
  );
}

export function SubjectSelect({ examTypes, subjects, value, onChange }: { examTypes: ExamType[]; subjects: Subject[]; value: number | ""; onChange: (v: number) => void }) {
  return (
    <NativeSelect value={value} onChange={(e) => onChange(Number(e.target.value))}>
      <option value="" disabled>Fanni tanlang</option>
      {examTypes.map((et) => (
        <optgroup key={et.id} label={et.name}>
          {subjects.filter((x) => x.examTypeId === et.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </optgroup>
      ))}
    </NativeSelect>
  );
}

export function NewTestButton({ examTypes, subjects, defaultSubjectId }: { examTypes: ExamType[]; subjects: Subject[]; defaultSubjectId?: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ subjectId: (defaultSubjectId ?? "") as number | "", title: "", description: "", durationMin: 60, isFree: false, isPublished: false });
  const { run, pending } = useRun();
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}><Plus /> Yangi test</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi test</DialogTitle>
            <DialogDescription>Keyingi qadamda savollarni import qilasiz.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Fan"><SubjectSelect examTypes={examTypes} subjects={subjects} value={f.subjectId} onChange={(v) => setF({ ...f, subjectId: v })} /></Field>
            <Field label="Test nomi"><Input value={f.title} placeholder="Matematika · variant №3" onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Qisqa tavsif"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
            <Field label="Vaqt (daqiqa)"><Input type="number" min={1} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: Number(e.target.value) })} /></Field>
            <label className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3 text-[15px] font-semibold">Bepul test <Switch checked={f.isFree} onCheckedChange={(v) => setF({ ...f, isFree: v })} /></label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Bekor qilish</Button>
            <Button
              disabled={pending}
              onClick={async () => {
                const r = await run(() => saveTest({ ...f, subjectId: Number(f.subjectId) }), "Test yaratildi");
                if (r.ok && r.data) router.push(`/admin/testlar/${r.data.id}`);
              }}
            >
              Yaratish va savol qoʻshish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
