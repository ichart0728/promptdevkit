"use client";

import { useEffect, useState } from "react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange: (value: string) => void;
  delay?: number;
};

export function SearchInput({ value, onChange, onDebouncedChange, delay = 200 }: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      onDebouncedChange(internalValue.trim());
    }, delay);
    return () => window.clearTimeout(handle);
  }, [internalValue, delay, onDebouncedChange]);

  return (
    <label className="flex-1 min-w-0">
      <span className="sr-only">Search prompts</span>
      <input
        type="search"
        value={internalValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setInternalValue(nextValue);
          onChange(nextValue);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onDebouncedChange(internalValue.trim());
          }
        }}
        placeholder="Search prompts…"
        className="w-full rounded-xl border border-slate-300 bg-white/60 px-4 py-2 text-sm text-slate-900 shadow-inner transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40 dark:focus:border-violet-500 dark:focus:ring-violet-500/40"
        aria-label="Search prompts"
      />
    </label>
  );
}
