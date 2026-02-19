export default function GlobalLoading() {
  return (
    <div className="container py-10">
      <div className="animate-pulse space-y-3">
        <div className="h-6 w-1/3 rounded bg-muted" />
        <div className="h-40 w-full rounded bg-muted" />
        <div className="h-40 w-full rounded bg-muted" />
      </div>
    </div>
  );
}
