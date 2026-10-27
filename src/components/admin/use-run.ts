"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Result<T> = { ok: true; data?: T } | { ok: false; error: string };

export function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  async function run<T>(fn: () => Promise<Result<T>>, success?: string): Promise<Result<T>> {
    const res = await fn();
    if (res.ok) {
      if (success) toast.success(success);
      start(() => router.refresh());
    } else toast.error(res.error);
    return res;
  }
  return { run, pending };
}
