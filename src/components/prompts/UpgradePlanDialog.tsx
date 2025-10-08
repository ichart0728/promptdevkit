"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";

import { pricingPlans } from "@/data/pricing";

const focusableSelector =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));

type UpgradePlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsage: number;
  usageLimit: number;
};

export function UpgradePlanDialog({
  open,
  onOpenChange,
  currentUsage,
  usageLimit,
}: UpgradePlanDialogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

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

  const progress = useMemo(() => {
    if (!usageLimit || usageLimit <= 0) return 100;
    const value = Math.round((currentUsage / usageLimit) * 100);
    return Math.max(0, Math.min(100, value));
  }, [currentUsage, usageLimit]);

  const remaining = usageLimit > 0 ? Math.max(usageLimit - currentUsage, 0) : 0;
  const isOverLimit = usageLimit > 0 && currentUsage >= usageLimit;
  const usageLabel = usageLimit > 0 ? `${currentUsage}/${usageLimit}` : `${currentUsage}`;

  const paidPlans = useMemo(
    () => pricingPlans.filter((plan) => plan.tier !== "free"),
    []
  );

  if (!open) return null;

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
        aria-labelledby="upgrade-dialog-heading"
        className="w-full max-w-3xl rounded-3xl border border-purple-300 bg-white p-8 shadow-2xl shadow-purple-400/30 transition dark:border-purple-600/50 dark:bg-slate-950"
      >
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-widest text-purple-500 dark:text-purple-300">
              Upgrade required
            </p>
            <h2 id="upgrade-dialog-heading" className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {isOverLimit
                ? "You’ve reached the limit on the Starter plan"
                : "You’re almost out of free prompts"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {isOverLimit
                ? "Create unlimited prompts, invite teammates, and unlock collaboration features by choosing a paid plan."
                : `Only ${remaining} prompt${remaining === 1 ? "" : "s"} left before you need to upgrade. Keep building without interruptions by selecting a plan below.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-300/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-purple-500/60"
            aria-label="Close upgrade dialog"
          >
            ✕
          </button>
        </header>

        <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/70 p-5 shadow-sm dark:border-purple-500/40 dark:bg-purple-500/10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-200">
                Usage {usageLabel} prompts
              </p>
              <p className="text-xs text-purple-700/80 dark:text-purple-200/80">
                Upgrade now to remove limits and access collaboration tools.
              </p>
            </div>
            <div className="flex w-full items-center gap-3 md:w-64">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-purple-200/70 dark:bg-purple-500/30">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all dark:bg-purple-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-purple-700 dark:text-purple-200">{progress}%</span>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {paidPlans.map((plan) => (
            <div
              key={plan.name}
              className={`flex h-full flex-col justify-between rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                plan.highlighted
                  ? "border-purple-400 bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:border-purple-500 dark:from-purple-500/10 dark:via-slate-950 dark:to-purple-900/40"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                  {plan.badge ? (
                    <span className="rounded-full bg-purple-600/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-200">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{plan.price}</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{plan.description}</p>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>
              <Link
                href={plan.href}
                className={`mt-6 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-purple-400/60 ${
                  plan.highlighted
                    ? "bg-purple-600 text-white hover:bg-purple-500"
                    : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
                }`}
                onClick={() => onOpenChange(false)}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </section>

        <footer className="mt-6 flex flex-col gap-3 rounded-2xl bg-slate-100/60 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-slate-100">Need a custom rollout?</span>
          <span>
            We’ll help migrate prompts, connect your stack, and design governance workflows for your org. Reach out at
            <a className="ml-1 font-semibold text-purple-600 hover:underline dark:text-purple-300" href="mailto:sales@promptdevkit.com">
              sales@promptdevkit.com
            </a>
            .
          </span>
        </footer>
      </div>
    </div>
  );
}
