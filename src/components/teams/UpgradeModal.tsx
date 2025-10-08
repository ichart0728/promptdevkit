"use client";

import { useEffect } from "react";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  message?: string;
};

export function UpgradeModal({ open, onClose, message }: UpgradeModalProps) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    if (open) {
      window.addEventListener("keydown", handleKey);
    }
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-violet-400/40 bg-white p-6 shadow-xl dark:border-violet-500/40 dark:bg-slate-950">
        <div className="flex flex-col gap-4">
          <h2
            id="upgrade-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Upgrade required
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {message ??
              "You've reached the limits of the free plan. Upgrade to unlock more teams and members."}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-violet-500"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                window.open("/pricing", "_blank", "noopener");
              }}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-violet-500"
              aria-label="Go to pricing"
            >
              View plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
