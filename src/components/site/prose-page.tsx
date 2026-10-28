export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl pt-8 pb-10">
      <h1 className="font-serif text-[48px] leading-[1.02] font-normal tracking-[-0.02em] sm:text-[68px]">{title}</h1>
      {updated ? <p className="mt-2 text-sm font-semibold text-muted">Yangilangan: {updated}</p> : null}
      <div className="mt-8 space-y-5 rounded-[24px] border border-line bg-surface p-6 text-[16px] leading-relaxed text-ink-2 sm:p-10 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h2:first-child]:mt-0 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1">
        {children}
      </div>
    </div>
  );
}
