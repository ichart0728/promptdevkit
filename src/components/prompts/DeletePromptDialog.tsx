"use client";

import { useEffect, useRef, useState } from "react";

type DeletePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  promptTitle: string;
};

const focusableSelector =
  "button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));

export function DeletePromptDialog({ open, onOpenChange, onConfirm, promptTitle }: DeletePromptDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setSubmitting(false);
      setErrorMessage(null);
      return;
    }

    lastActiveElement.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;
        const focusables = getFocusableElements(container);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastActiveElement.current?.focus();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete prompt.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-prompt-heading"
        className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl shadow-red-500/20 transition dark:border-red-500/40 dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="delete-prompt-heading" className="text-xl font-semibold text-red-600 dark:text-red-300">
              Delete prompt?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This will move <span className="font-semibold">{promptTitle}</span> to the archive. You can no longer access it from the dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-300/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-red-500/60"
            aria-label="Close delete dialog"
          >
            ✕
          </button>
        </header>

        {errorMessage ? (
          <p className="mt-4 text-sm text-red-500" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-transparent px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white/60 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:hover:text-slate-100"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-red-500 dark:hover:bg-red-400 dark:focus:ring-red-500/60"
          >
            {submitting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
