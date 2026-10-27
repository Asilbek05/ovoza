"use client";
import { useActionState } from "react";
import { adminLogin } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <form action={action} className="space-y-4">
      <Field label="Parol" htmlFor="password" error={state && !state.ok ? state.error : undefined}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required autoFocus aria-invalid={state ? !state.ok : undefined} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? "Tekshirilmoqda…" : "Kirish"}</Button>
    </form>
  );
}
