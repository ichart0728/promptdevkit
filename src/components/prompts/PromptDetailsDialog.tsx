"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { formatUpdatedAt } from "@/lib/format";
import { PromptWithTags } from "@/types/prompt";

const focusableSelector =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 6 12 12" />
    <path d="m6 18 12-12" />
  </svg>
);

const CommentIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 8h10" />
    <path d="M7 12h6" />
    <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
  </svg>
);

type PromptDetailsDialogProps = {
  prompt: PromptWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenComments?: () => void;
};

export function PromptDetailsDialog({
  prompt,
  open,
  onOpenChange,
}: PromptDetailsDialogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  const commentCount = prompt.commentCount ?? 0;
  const formattedUpdatedAt = useMemo(
    () => formatUpdatedAt(prompt.updatedAt),
    [prompt.updatedAt]
  );

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    lastActiveElement.current = document.activeElement as HTMLElement | null;

    const focusInitialField = () => {
      const container = containerRef.current;
      if (!container) return;
      const focusables =
        container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length > 0) {
        window.setTimeout(() => focusables[0]?.focus(), 0);
      }
    };

    focusInitialField();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => !el.hasAttribute("data-focus-guard"));
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
  }, [handleClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-details-heading"
        className="flex h-[75vh] w-full max-w-4xl flex-col gap-4 overflow-hidden rounded-2xl border border-violet-200 bg-white p-6 shadow-2xl shadow-violet-500/20 transition dark:border-violet-500/40 dark:bg-slate-900"
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="prompt-details-heading"
              className="text-xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Prompt details
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-violet-500/60"
                aria-label="Close prompt details"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review the full prompt content, notes, and tags without leaving the
            dashboard.
          </p>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Last updated
              </p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                {formattedUpdatedAt}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Comment count
              </p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                {commentCount}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Title
            </p>
            <p className="rounded-xl border border-slate-200 bg-white/80 p-4 text-base font-medium text-slate-900 transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100">
              {prompt.title}
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prompt body
            </p>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words">
                {prompt.body}
              </pre>
            </div>
          </section>

          {prompt.notes ? (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Notes
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-600 transition dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="whitespace-pre-wrap break-words">
                  {prompt.notes}
                </p>
              </div>
            </section>
          ) : null}

          {prompt.tags.length ? (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {prompt.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 transition dark:bg-violet-500/20 dark:text-violet-200"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
