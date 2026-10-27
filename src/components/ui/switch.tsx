"use client";
import * as React from "react";
import * as S from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn("relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full bg-[#cfd8ea] transition data-[state=checked]:bg-primary disabled:opacity-50", className)}
      {...props}
    >
      <S.Thumb className="block size-5 translate-x-1 rounded-full bg-white shadow transition data-[state=checked]:translate-x-6" />
    </S.Root>
  );
}
