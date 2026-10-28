import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { ProfileForms } from "./form";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish?next=/kabinet/profil");
  return (
    <div className="container-page pt-10 pb-20">
      <Link href="/kabinet" className="mb-5 inline-flex h-11 items-center gap-1.5 rounded-xl border border-line bg-surface px-4 text-sm font-semibold hover:border-primary-mid"><ArrowLeft className="size-4" /> Kabinet</Link>
      <h1 className="mb-8 t-h1">Profil</h1>
      <ProfileForms name={user.name} phone={user.phone} audience={user.audience === "applicant" ? "applicant" : "teacher"} />
    </div>
  );
}
