"use client";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { blobToWav } from "@/lib/wav";
import { formatDuration } from "@/lib/utils";

const MAX_SEC = 6 * 60; // keeps the WAV under the 20 MB upload limit

/** Record the teacher's voice right in the browser; result is a seekable WAV file. */
export function AudioRecorder({ onDone, disabled, label = "Mikrofondan yozish" }: { onDone: (file: File, durationSec: number) => void | Promise<void>; disabled?: boolean; label?: string }) {
  const [state, setState] = useState<"idle" | "recording" | "processing">("idle");
  const [sec, setSec] = useState(0);
  const [level, setLevel] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const raf = useRef(0);
  const started = useRef(0);

  const cleanup = () => {
    if (timer.current) clearInterval(timer.current);
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => cleanup, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Brauzer yozishni qoʻllamaydi. Chrome yoki Safari yangi versiyasidan foydalaning.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      chunks.current = [];
      const mr = new MediaRecorder(s);
      rec.current = mr;
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = async () => {
        const type = mr.mimeType || "audio/webm";
        cleanup();
        setState("processing");
        try {
          const { file, durationSec } = await blobToWav(new Blob(chunks.current, { type }));
          await onDone(file, durationSec);
        } catch {
          toast.error("Yozuvni qayta ishlab boʻlmadi. Qayta urinib koʻring.");
        } finally {
          setState("idle");
          setLevel(0);
        }
      };
      // live level meter
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const analyser = ac.createAnalyser();
      analyser.fftSize = 256;
      ac.createMediaStreamSource(s).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const b of data) peak = Math.max(peak, Math.abs(b - 128));
        setLevel(Math.min(1, peak / 80));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
      mr.addEventListener("stop", () => void ac.close());
      mr.start(1000);
      started.current = Date.now();
      setSec(0);
      setState("recording");
      timer.current = setInterval(() => {
        const t = Math.floor((Date.now() - started.current) / 1000);
        setSec(t);
        if (t >= MAX_SEC) stop();
      }, 250);
    } catch (e) {
      cleanup();
      const denied = e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "SecurityError");
      toast.error(denied ? "Mikrofonga ruxsat berilmadi. Brauzer manzil satridagi qulf belgisidan ruxsat bering." : "Mikrofon topilmadi.");
    }
  }

  function stop() {
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }

  if (state === "recording") {
    return (
      <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-danger/40 bg-danger-soft px-4 py-3">
        <span className="relative flex size-3"><span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-60" /><span className="relative size-3 rounded-full bg-danger" /></span>
        <span className="font-display text-lg font-bold tabular-nums text-danger-ink">{formatDuration(sec)}</span>
        <span aria-hidden className="flex h-6 flex-1 items-center gap-[3px]">
          {Array.from({ length: 24 }, (_, i) => (
            <span key={i} className="w-1 rounded-full bg-danger" style={{ height: `${Math.max(12, level * 100 * (0.5 + 0.5 * Math.sin(i * 1.3 + sec)))}%` }} />
          ))}
        </span>
        <Button variant="danger" size="sm" onClick={stop}><Square className="fill-current" /> Toʻxtatish</Button>
      </div>
    );
  }
  return (
    <Button type="button" variant="primary" size={label === "Qayta yozish" ? "md" : "lg"} disabled={disabled || state === "processing"} onClick={start}>
      {state === "processing" ? <><Loader2 className="animate-spin" /> Qayta ishlanmoqda…</> : <><Mic /> {label}</>}
    </Button>
  );
}
