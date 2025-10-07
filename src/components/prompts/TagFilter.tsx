"use client";

import { useMemo, useState } from "react";

type TagFilterProps = {
  options: string[];
  selected: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
};

const normalizeOption = (tag: string) => tag.trim().toLowerCase();

const sortTags = (values: string[]) => [...values].sort((a, b) => a.localeCompare(b));

export function TagFilter({ options, selected, onChange, disabled }: TagFilterProps) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const DISPLAY_LIMIT = 12;

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
    const sorted = sortTags(Array.from(unique));
    if (!query.trim()) return sorted;
    const normalizedQuery = normalizeOption(query);
    return sorted.filter((tag) => tag.includes(normalizedQuery));
  }, [options, selected, query]);

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
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setShowAll(false);
        }}
        placeholder="Filter tags"
        className="h-8 w-40 rounded-full border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/60 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-violet-500"
        disabled={disabled}
        aria-label="Filter tags"
      />
      <div className="flex flex-wrap items-center gap-2">
        {normalizedOptions.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">No tags yet</span>
        ) : (
          (showAll ? normalizedOptions : normalizedOptions.slice(0, DISPLAY_LIMIT)).map((tag) => {
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
      {normalizedOptions.length > DISPLAY_LIMIT ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:bg-white/50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
          disabled={disabled}
        >
          {showAll ? "Less" : `More (${normalizedOptions.length - DISPLAY_LIMIT})`}
        </button>
      ) : null}
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
