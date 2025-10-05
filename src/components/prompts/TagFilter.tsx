"use client";

import { useMemo } from "react";

type TagFilterProps = {
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

const normalizeOption = (tag: string) => tag.trim().toLowerCase();

const sortTags = (values: string[]) => [...values].sort((a, b) => a.localeCompare(b));

export function TagFilter({ options, selected, onChange, disabled }: TagFilterProps) {
  const normalizedOptions = useMemo(() => {
    const unique = new Set<string>();
    options.forEach((tag) => {
      const normalized = normalizeOption(tag);
      if (normalized) unique.add(normalized);
    });
    selected.forEach((tag) => {
      const normalized = normalizeOption(tag);
      if (normalized) unique.add(normalized);
    });
    return sortTags(Array.from(unique));
  }, [options, selected]);

  const toggleTag = (tag: string) => {
    if (disabled) return;
    const normalized = normalizeOption(tag);
    const isSelected = selected.includes(normalized);
    const next = isSelected
      ? selected.filter((value) => value !== normalized)
      : [...selected, normalized];
    onChange(sortTags(next));
  };

  const clearSelection = () => {
    if (disabled) return;
    if (selected.length === 0) return;
    onChange([]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Tags
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {normalizedOptions.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">No tags yet</span>
        ) : (
          normalizedOptions.map((tag) => {
            const isActive = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-medium lowercase transition focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:focus:ring-violet-500/60 ${
                  isActive
                    ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:border-violet-500 dark:bg-violet-500/20 dark:text-violet-200"
                    : "border-transparent bg-slate-200/60 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                aria-pressed={isActive}
                onClick={() => toggleTag(tag)}
                disabled={disabled}
              >
                {tag}
              </button>
            );
          })
        )}
      </div>
      <button
        type="button"
        onClick={clearSelection}
        className="ml-auto inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-white/50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
        disabled={disabled || selected.length === 0}
      >
        Clear
      </button>
    </div>
  );
}
