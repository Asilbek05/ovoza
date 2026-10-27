import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="flex flex-col items-center gap-5 text-center">
        <Logo />
        <p className="font-display text-[88px] leading-none font-extrabold text-primary">404</p>
        <h1 className="font-display text-3xl font-bold">Bu sahifa topilmadi</h1>
        <p className="max-w-sm text-muted">Manzil notoʻgʻri yoki sahifa oʻchirilgan boʻlishi mumkin.</p>
        <Button asChild variant="primary" size="lg"><Link href="/">Bosh sahifaga</Link></Button>
      </div>
    </main>
  );
}
