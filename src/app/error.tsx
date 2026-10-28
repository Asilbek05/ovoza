"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="container-page flex min-h-dvh flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="font-display text-6xl font-bold text-primary">Voy!</p>
      <h1 className="t-h1">Nimadir xato ketdi</h1>
      <p className="max-w-md text-muted">Sahifani yuklab boʻlmadi. Birozdan keyin qayta urinib koʻring — javoblaringiz saqlanib qolgan.</p>
      <div className="flex gap-3"><Button variant="primary" size="lg" onClick={reset}>Qayta urinish</Button><Button asChild variant="outline" size="lg"><Link href="/">Bosh sahifa</Link></Button></div>
    </main>
  );
}
