"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, AudioLines, Check, Clock, ImagePlus, Plus, Trash2, Upload } from "lucide-react";
import type { Question } from "@/db/schema";
import { saveExplanation, uploadMedia } from "../../../actions";
import { useRun } from "@/components/admin/use-run";
import { AudioRecorder } from "@/components/admin/audio-recorder";
import { ExplanationPlayer, type PlayerImage } from "@/components/player/explanation-player";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, formatDuration } from "@/lib/utils";

type Similar = { text: string; options: string[]; correctIndex: number };
type State = { audioUrl: string | null; audioDurationSec: number | null; note: string; authorName: string; images: PlayerImage[]; similar: Similar | null };
const L = "ABCDEF";

function measure(url: string) {
  return new Promise<number | null>((res) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => res(Number.isFinite(a.duration) ? a.duration : null);
    a.onerror = () => res(null);
    a.src = url;
  });
}

export function ExplanationEditor({ question, initial, prevId, nextId }: { question: Question; initial: State; prevId: number | null; nextId: number | null }) {
  const [st, setSt] = useState<State>(initial);
  const [uploading, setUploading] = useState<"audio" | "image" | null>(null);
  const [now, setNow] = useState(0);
  const audioInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const { run, pending } = useRun();
  const dirty = JSON.stringify(st) !== JSON.stringify(initial);

  async function upload(files: FileList | File[], kind: "audio" | "image", knownDuration?: number) {
    setUploading(kind);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("kind", kind);
        const r = await uploadMedia(fd);
        if (!r.ok) { toast.error(`${file.name}: ${r.error}`); continue; }
        const url = r.data!.url;
        if (kind === "audio") {
          const d = knownDuration ?? (await measure(url));
          setSt((x) => ({ ...x, audioUrl: url, audioDurationSec: d }));
          toast.success("Audio yuklandi");
        } else {
          setSt((x) => {
            const last = x.images.at(-1)?.startSec ?? -30;
            const startSec = x.images.length === 0 ? 0 : Math.min(Math.round(last + 30), Math.max(0, Math.floor((x.audioDurationSec ?? last + 30) - 1)));
            return { ...x, images: [...x.images, { url, startSec, caption: "" }] };
          });
        }
      }
    } finally {
      setUploading(null);
    }
  }

  const setImg = (i: number, patch: Partial<PlayerImage>) => setSt((x) => ({ ...x, images: x.images.map((im, j) => (j === i ? { ...im, ...patch } : im)) }));

  const save = () =>
    run(() => saveExplanation({ questionId: question.id, ...st, similar: st.similar }), "Tushuntirish saqlandi");

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_480px]">
      <div className="min-w-0 space-y-5">
        <Card className="p-5">
          <p className="text-[13px] font-semibold text-muted">{question.topic ?? "Savol"}</p>
          <p className="mt-1 text-[17px] leading-relaxed font-semibold whitespace-pre-line">{question.text}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {question.options.map((o, j) => (
              <span key={j} className={cn("rounded-full px-3 py-1 text-[13px] font-medium", j === question.correctIndex ? "bg-success-soft font-bold text-success-ink" : "bg-bg text-ink-2")}>{L[j]}) {o}</span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-white"><AudioLines className="size-5" /></span>
            <div>
              <h2 className="font-display text-xl font-bold">1. Audio</h2>
              <p className="text-[13px] text-muted">Mikrofondan yozing yoki fayl yuklang: mp3, m4a, ogg, wav · 20 MB gacha</p>
            </div>
          </div>
          {st.audioUrl ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-bg p-3 pl-4">
              <Check className="size-5 text-success" />
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{st.audioUrl.split("/").pop()}</span>
              <span className="text-sm font-semibold text-muted">{formatDuration(st.audioDurationSec)}</span>
              <Button variant="outline" size="sm" onClick={() => audioInput.current?.click()} disabled={!!uploading}>Almashtirish</Button>
              <AudioRecorder label="Qayta yozish" disabled={!!uploading} onDone={(f, d) => upload([f], "audio", d)} />
              <Button variant="ghost" size="icon-sm" aria-label="Audioni olib tashlash" onClick={() => setSt({ ...st, audioUrl: null, audioDurationSec: null })}><Trash2 /></Button>
            </div>
          ) : (
            <div className="space-y-3">
            <AudioRecorder disabled={!!uploading} onDone={(f, d) => upload([f], "audio", d)} />
            <button
              type="button"
              onClick={() => audioInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) void upload([e.dataTransfer.files[0]], "audio"); }}
              className="flex w-full flex-col items-center gap-2 rounded-[16px] border-2 border-dashed border-primary-mid/60 bg-bg px-6 py-10 transition hover:border-primary"
            >
              <Upload className="size-6 text-primary" />
              <span className="font-display text-lg font-bold">{uploading === "audio" ? "Yuklanmoqda…" : "yoki tayyor audioni tashlang / tanlang"}</span>
            </button>
            </div>
          )}
          <input ref={audioInput} type="file" hidden accept="audio/*,.mp3,.m4a,.ogg,.wav,.webm" onChange={(e) => e.target.files?.length && upload([e.target.files[0]], "audio")} />
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-ink"><ImagePlus className="size-5" /></span>
              <div>
                <h2 className="font-display text-xl font-bold">2. Yechim rasmlari</h2>
                <p className="text-[13px] text-muted">2–4 ta rasm. Har biri audioning qaysi soniyasida ochiladi?</p>
              </div>
            </div>
            <Button variant="soft" size="sm" disabled={!!uploading || st.images.length >= 8} onClick={() => imgInput.current?.click()}><Plus /> {uploading === "image" ? "Yuklanmoqda…" : "Rasm qoʻshish"}</Button>
            <input ref={imgInput} type="file" hidden multiple accept="image/*" onChange={(e) => e.target.files?.length && upload(e.target.files, "image")} />
          </div>
          {st.images.length === 0 ? (
            <p className="rounded-2xl bg-bg px-4 py-6 text-center text-[15px] text-muted">Hali rasm yoʻq. Ustoz yuborgan yechim kadrlarini qoʻshing.</p>
          ) : (
            <ul className="space-y-3">
              {st.images.map((im, i) => (
                <li key={im.url + i} className="flex flex-wrap items-center gap-3 rounded-[16px] border border-line p-3 sm:flex-nowrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url} alt="" className="h-16 w-24 shrink-0 rounded-xl border border-line-2 bg-bg object-contain" />
                  <Input className="h-10 min-w-0 flex-1" placeholder={`Sarlavha (masalan: ${i === 0 ? "Soddalashtirish" : "Viyet teoremasi"})`} value={im.caption} onChange={(e) => setImg(i, { caption: e.target.value })} aria-label="Rasm sarlavhasi" />
                  <div className="flex items-center gap-1.5">
                    <Input className="h-10 w-20 text-center tabular-nums" type="number" min={0} step={1} value={Math.round(im.startSec)} onChange={(e) => setImg(i, { startSec: Number(e.target.value) })} aria-label="Boshlanish soniyasi" />
                    <span className="text-[13px] text-muted">s</span>
                    <Button variant="outline" size="sm" title="Pleyerdagi hozirgi vaqtni olish" onClick={() => setImg(i, { startSec: Math.floor(now) })}><Clock /> {formatDuration(now)}</Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Rasmni olib tashlash" onClick={() => setSt({ ...st, images: st.images.filter((_, j) => j !== i) })}><Trash2 /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">3. Matnli izoh va muallif</h2>
          <Field label="Qisqa izoh (audio ostida chiqadi)"><Textarea rows={3} value={st.note} placeholder="Viyet teoremasida yigʻindi −b/a = +4 boʻladi…" onChange={(e) => setSt({ ...st, note: e.target.value })} /></Field>
          <Field label="Ustoz (muallif)"><Input value={st.authorName} placeholder="Kamola Rahimova" onChange={(e) => setSt({ ...st, authorName: e.target.value })} /></Field>
        </Card>

        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">4. Oʻxshash savol</h2>
              <p className="text-[13px] text-muted">Tushuntirishdan keyin foydalanuvchi oʻzini tekshiradi.</p>
            </div>
            <Switch checked={!!st.similar} aria-label="Oʻxshash savol" onCheckedChange={(v) => setSt({ ...st, similar: v ? { text: "", options: ["", "", "", ""], correctIndex: 0 } : null })} />
          </div>
          {st.similar ? (
            <div className="space-y-3">
              <Textarea rows={2} value={st.similar.text} placeholder="x² − 6x + 8 = 0 tenglamaning ildizlari…" onChange={(e) => setSt({ ...st, similar: { ...st.similar!, text: e.target.value } })} aria-label="Oʻxshash savol matni" />
              <div className="grid gap-2 sm:grid-cols-2">
                {st.similar.options.map((o, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <button type="button" aria-label={`${L[j]} toʻgʻri`} aria-pressed={st.similar!.correctIndex === j} onClick={() => setSt({ ...st, similar: { ...st.similar!, correctIndex: j } })} className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold", st.similar!.correctIndex === j ? "border-success bg-success text-white" : "border-line bg-bg")}>
                      {st.similar!.correctIndex === j ? <Check className="size-4" /> : L[j]}
                    </button>
                    <Input className="h-10" value={o} onChange={(e) => setSt({ ...st, similar: { ...st.similar!, options: st.similar!.options.map((x, k) => (k === j ? e.target.value : x)) } })} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line-2 px-5 py-3.5">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{(st.authorName || "U").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <span className="flex-1"><span className="block font-semibold">{st.authorName || "Ustoz"}</span><span className="block text-[13px] text-muted">Foydalanuvchi koʻradigan koʻrinish</span></span>
          </div>
          <div className="space-y-3 bg-bg p-4">
            <ExplanationPlayer audioUrl={st.audioUrl} durationSec={st.audioDurationSec} images={st.images} onTime={setNow} compact />
            {st.note ? <div className="bubble-in max-w-[90%] bg-surface px-4 py-3 text-[15px] leading-relaxed">{st.note}</div> : null}
          </div>
        </Card>
        <div className="flex gap-2">
          <Button variant="primary" size="lg" className="flex-1" disabled={pending || !dirty} onClick={save}>{dirty ? "Saqlash" : "Saqlangan"}</Button>
        </div>
        <div className="flex justify-between gap-2">
          {prevId ? <Button asChild variant="outline" size="sm"><Link href={`/admin/savollar/${prevId}`}><ArrowLeft /> Oldingi savol</Link></Button> : <span />}
          {nextId ? <Button asChild variant="outline" size="sm"><Link href={`/admin/savollar/${nextId}`}>Keyingi savol <ArrowRight /></Link></Button> : null}
        </div>
      </aside>
    </div>
  );
}
