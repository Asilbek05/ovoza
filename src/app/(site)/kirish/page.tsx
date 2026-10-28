import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthCard } from "@/components/site/auth";

export const metadata = { title: "Kirish" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next || "/kabinet");
  return (
    <AuthCard mode="login" next={next}>
      <p className="mt-5 text-center text-sm"><Link href="/tiklash" className="font-semibold text-ink-2 hover:text-primary hover:underline">Parolni unutdingizmi?</Link></p>
      <p className="mt-3 text-center text-sm text-muted">Hisobingiz yoʻqmi? <Link href={`/royxat${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary hover:underline">Roʻyxatdan oʻting</Link></p>
    </AuthCard>
  );
}
