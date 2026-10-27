"use client";
import * as React from "react";
import * as T from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = T.Root;
export const TabsContent = T.Content;
export function TabsList({ className, ...props }: React.ComponentProps<typeof T.List>) {
  return <T.List className={cn("inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn("h-10 rounded-full px-4 text-[15px] font-semibold text-ink-2 transition hover:text-primary-deep data-[state=active]:bg-primary data-[state=active]:text-white", className)}
      {...props}
    />
  );
}
