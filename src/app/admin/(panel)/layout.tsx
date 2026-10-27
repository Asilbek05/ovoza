import { requireAdmin } from "@/lib/admin-guard";
import { AdminShell } from "./shell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
