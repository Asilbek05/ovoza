import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AuthCard } from "@/components/site/auth";

export const metadata = { title: "Roʻyxatdan oʻtish" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next || "/kabinet");
  return (
    <AuthCard mode="register" next={next}>
      <p className="mt-6 text-center text-[15px] text-muted">Hisobingiz bormi? <Link href={`/kirish${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary hover:underline">Kirish</Link></p>
    </AuthCard>
  );
}
