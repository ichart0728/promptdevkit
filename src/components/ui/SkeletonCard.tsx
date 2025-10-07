export function SkeletonCard() {
  return (
    <div className="h-full animate-pulse rounded-2xl border border-slate-200 bg-white/60 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="h-5 w-2/3 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
        <div className="h-4 w-5/6 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
        <span className="h-6 w-14 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
        <span className="h-6 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
      </div>
    </div>
  );
}
