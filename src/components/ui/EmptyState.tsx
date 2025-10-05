type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title = "No prompts yet",
  description = "Create your first prompt to populate the dashboard.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center shadow-inner dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {onAction && actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-500/60"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
