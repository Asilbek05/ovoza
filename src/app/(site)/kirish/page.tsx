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
      <p className="mt-6 text-center text-[15px] text-muted">Hisobingiz yoʻqmi? <Link href={`/royxat${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary hover:underline">Roʻyxatdan oʻting</Link></p>
    </AuthCard>
  );
}
