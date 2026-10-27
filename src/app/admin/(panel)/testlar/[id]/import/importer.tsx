"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Check, FileUp, Sparkles, Trash2, Wand2 } from "lucide-react";
import { importQuestions, parseImport } from "../../../../actions";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/misc";
import { Input, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Q = { text: string; options: string[]; correct_index: number | null; topic?: string | null };
const L = "ABCDEF";
const SAMPLE = `1. 2x² − 8x + 6 = 0 tenglamaning ildizlarini toping.
A) 1 va 3  B) 2 va 3  C) −1 va −3  D) 1 va 6
Javob: A

2. 240 ning 15 foizini toping.
A) 24  B) 32  C) 40  D) 36
Javob: D`;

export function Importer({ testId, ai }: { testId: number; ai: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<false | "parse" | "ai" | "save">(false);
  const [items, setItems] = useState<Q[] | null>(null);
  const [source, setSource] = useState<string>("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function parse(force: "auto" | "ai") {
    const fd = new FormData();
    fd.set("mode", force);
    if (mode === "file" && file) fd.set("file", file);
    else fd.set("text", text);
    setBusy(force === "ai" ? "ai" : "parse");
    const r = await parseImport(fd);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setItems(r.data!.questions);
    setSource(r.data!.source);
    toast.success(`${r.data!.questions.length} ta savol topildi`);
  }

  async function save() {
    if (!items) return;
    setBusy("save");
    const r = await importQuestions(testId, items);
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    toast.success(`${r.data!.count} ta savol qoʻshildi`);
    router.push(`/admin/testlar/${testId}`);
    router.refresh();
  }

  const missing = items?.filter((q) => q.correct_index === null).length ?? 0;
  const update = (i: number, patch: Partial<Q>) => setItems((xs) => xs!.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "file")}>
          <TabsList><TabsTrigger value="text">Matn joylash</TabsTrigger><TabsTrigger value="file">Fayl yuklash</TabsTrigger></TabsList>
          <TabsContent value="text" className="mt-4">
            <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={SAMPLE} className="font-mono text-[14px]" aria-label="Savollar matni" />
            <button type="button" className="mt-2 text-sm font-semibold text-primary hover:underline" onClick={() => setText(SAMPLE)}>Namunani qoʻyish</button>
          </TabsContent>
          <TabsContent value="file" className="mt-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
              className={cn("flex w-full flex-col items-center gap-3 rounded-[24px] border-2 border-dashed px-6 py-12 text-center transition", drag ? "border-primary bg-primary-soft" : "border-primary-mid/60 bg-bg hover:border-primary")}
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-white"><FileUp className="size-6" /></span>
              <span className="font-display text-lg font-bold">{file ? file.name : "Faylni shu yerga tashlang yoki tanlang"}</span>
              <span className="text-sm text-muted">.docx, .pdf, .txt yoki .json · 15 MB gacha</span>
            </button>
            <input ref={inputRef} type="file" hidden accept=".docx,.pdf,.txt,.json,.md" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </TabsContent>
        </Tabs>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button variant="primary" disabled={!!busy || (mode === "text" ? !text.trim() : !file)} onClick={() => parse("auto")}>
            <Wand2 /> {busy === "parse" ? "Ajratilmoqda…" : "Savollarni ajratish"}
          </Button>
          <Button variant="soft" disabled={!ai || !!busy || (mode === "text" ? !text.trim() : !file)} onClick={() => parse("ai")} title={ai ? "" : "ANTHROPIC_API_KEY sozlanmagan"}>
            <Sparkles /> {busy === "ai" ? "AI oʻqiyapti…" : "AI bilan ajratish"}
          </Button>
          <span className="text-[13px] text-muted">{ai ? "Oddiy format avtomatik taniladi; murakkab hujjatlar uchun AI." : "AI uchun .env da ANTHROPIC_API_KEY kerak. Oddiy «1. … A) … Javob: B» formati AI siz ham ishlaydi."}</span>
        </div>
      </Card>

      {items ? (
        <section className="space-y-3">
          <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-line bg-surface/95 p-3 pl-5 backdrop-blur lg:top-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-bold">{items.length} ta savol</span>
              <Badge tone="gray">{source === "ai" ? "AI" : source === "json" ? "JSON" : "format boʻyicha"}</Badge>
              {missing ? <Badge tone="red"><AlertTriangle className="size-3.5" /> {missing} tasida javob belgilanmagan</Badge> : <Badge tone="green"><Check className="size-3.5" /> hammasi tayyor</Badge>}
            </div>
            <Button variant="primary" disabled={!!busy || missing > 0 || !items.length} onClick={save}>{busy === "save" ? "Saqlanmoqda…" : "Testga qoʻshish"}</Button>
          </div>
          {items.map((q, i) => (
            <Card key={i} className={cn("p-4 sm:p-5", q.correct_index === null && "border-danger/50 ring-2 ring-danger/10")}>
              <div className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary-deep">{i + 1}</span>
                <div className="min-w-0 flex-1 space-y-3">
                  <Textarea rows={2} value={q.text} onChange={(e) => update(i, { text: e.target.value })} aria-label="Savol matni" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((o, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <button type="button" aria-label={`${L[j]} toʻgʻri`} aria-pressed={q.correct_index === j} onClick={() => update(i, { correct_index: j })} className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold", q.correct_index === j ? "border-success bg-success text-white" : "border-line bg-bg")}>
                          {q.correct_index === j ? <Check className="size-4" /> : L[j]}
                        </button>
                        <Input value={o} className="h-10" onChange={(e) => update(i, { options: q.options.map((x, k) => (k === j ? e.target.value : x)) })} />
                      </div>
                    ))}
                  </div>
                  <Input value={q.topic ?? ""} className="h-10 max-w-sm" placeholder="Mavzu" onChange={(e) => update(i, { topic: e.target.value })} aria-label="Mavzu" />
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Olib tashlash" onClick={() => setItems((xs) => xs!.filter((_, k) => k !== i))}><Trash2 /></Button>
              </div>
            </Card>
          ))}
        </section>
      ) : null}
    </div>
  );
}
