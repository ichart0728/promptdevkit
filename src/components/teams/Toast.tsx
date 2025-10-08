"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
};

export function Toast({
  open,
  title,
  description,
  tone = "info",
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const toneClasses: Record<NonNullable<ToastProps["tone"]>, string> = {
    success:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/60 dark:bg-emerald-500/15 dark:text-emerald-200",
    error:
      "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/60 dark:bg-rose-500/15 dark:text-rose-200",
    info:
      "border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
  } as const;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex w-full max-w-sm flex-col gap-1 rounded-xl border px-4 py-3 shadow-lg ${toneClasses[tone]}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description ? (
              <p className="text-xs opacity-80">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-xs text-current transition hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:hover:bg-white/10"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
