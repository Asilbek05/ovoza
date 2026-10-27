export default function Loading() {
  return (
    <div role="status" aria-label="Yuklanmoqda" className="container-page animate-pulse space-y-5 pt-10">
      <div className="h-10 w-2/3 max-w-md rounded-2xl bg-primary-soft" />
      <div className="h-5 w-1/2 max-w-sm rounded-xl bg-line-2" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-32 rounded-[28px] border border-line bg-surface" />)}</div>
    </div>
  );
}
