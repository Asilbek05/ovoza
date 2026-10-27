import "server-only";
import { redirect } from "next/navigation";
import { isAdmin } from "./session";

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** For server actions: throws instead of redirecting. */
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("Ruxsat yoʻq");
}
