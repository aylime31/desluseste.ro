export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 w-full rounded bg-slate-700/50" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card-tight animate-pulse">
      <div className="h-4 w-32 bg-slate-700/50 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-slate-700/50 rounded" />
        <div className="h-3 bg-slate-700/50 rounded" />
        <div className="h-3 bg-slate-700/50 rounded w-5/6" />
      </div>
    </div>
  );
}
