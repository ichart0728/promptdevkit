"use client";

import { PromptCard } from "@/components/prompts/PromptCard";
import { SearchInput } from "@/components/prompts/SearchInput";
import { TagFilter } from "@/components/prompts/TagFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PromptWithTags } from "@/types/prompt";

type PromptListProps = {
  prompts: PromptWithTags[];
  loading: boolean;
  error: string | null;
  searchValue: string;
  onSearchInputChange: (value: string) => void;
  onSearchDebouncedChange: (value: string) => void;
  selectedTags: string[];
  availableTags: string[];
  onTagChange: (tags: string[]) => void;
  onRetry: () => void;
  onAddPrompt: () => void;
};

export function PromptList({
  prompts,
  loading,
  error,
  searchValue,
  onSearchInputChange,
  onSearchDebouncedChange,
  selectedTags,
  availableTags,
  onTagChange,
  onRetry,
  onAddPrompt,
}: PromptListProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-900/50">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchValue}
            onChange={onSearchInputChange}
            onDebouncedChange={onSearchDebouncedChange}
          />
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={onAddPrompt}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-500/60"
              aria-haspopup="dialog"
            >
              ＋ Add Prompt
            </button>
          </div>
        </div>
        <TagFilter options={availableTags} selected={selectedTags} onChange={onTagChange} />
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50/80 p-10 text-center shadow-sm dark:border-red-500/40 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-200">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/60 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/20 dark:focus:ring-red-500/60"
          >
            Try again
          </button>
        </div>
      ) : prompts.length === 0 && !loading ? (
        <EmptyState onAction={onAddPrompt} actionLabel="Add Prompt" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {loading && prompts.length === 0
            ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={`skeleton-${index}`} />)
            : prompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} />)}
          {loading && prompts.length > 0
            ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={`loading-${index}`} />)
            : null}
        </div>
      )}
    </section>
  );
}
