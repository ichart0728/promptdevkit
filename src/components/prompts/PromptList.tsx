"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import { PromptCard } from "@/components/prompts/PromptCard";
import { SearchInput } from "@/components/prompts/SearchInput";
import { TagFilter } from "@/components/prompts/TagFilter";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
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
  onPromptUpdated: (prompt: PromptWithTags) => void | Promise<void>;
  onPromptDeleted: (promptId: string) => void | Promise<void>;
  freePlanLimit?: number;
  totalPromptCount?: number;
  onRequestUpgrade: () => void;
  workspaceControl?: ReactNode;
  contextControl?: ReactNode;
  addPromptDisabled?: boolean;
  addPromptDisabledReason?: string;
};

type PaginationControlsProps = {
  currentPage: number;
  pageCount: number;
  disabled?: boolean;
  siblingCount?: number;
  onPageChange: (page: number) => void;
};

const PaginationControls = ({
  currentPage,
  pageCount,
  disabled,
  siblingCount = 1,
  onPageChange,
}: PaginationControlsProps) => {
  const clampedPage = Math.min(Math.max(1, currentPage), pageCount);
  const range: number[] = [];
  const start = Math.max(1, clampedPage - siblingCount);
  const end = Math.min(pageCount, clampedPage + siblingCount);

  if (start > 1) {
    range.push(1);
    if (start > 2) range.push(-1); // ellipsis sentinel
  }

  for (let page = start; page <= end; page += 1) {
    range.push(page);
  }

  if (end < pageCount) {
    if (end < pageCount - 1) range.push(-2); // ellipsis sentinel
    range.push(pageCount);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(clampedPage - 1)}
        disabled={disabled || clampedPage === 1}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300"
      >
        Prev
      </button>
      <div className="flex items-center gap-1">
        {range.map((item, index) => {
          if (item === -1 || item === -2) {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-xs text-slate-400 dark:text-slate-500"
              >
                …
              </span>
            );
          }
          const page = item;
          const isActive = page === clampedPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              disabled={disabled || page === clampedPage}
              className={`rounded-full border px-3 py-1 text-xs transition focus:outline-none focus:ring-2 focus:ring-violet-300/60 disabled:cursor-default disabled:border-violet-500 disabled:bg-violet-500/20 disabled:text-violet-600 dark:disabled:border-violet-500 dark:disabled:bg-violet-500/20 dark:disabled:text-violet-200 ${
                isActive
                  ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-200"
                  : "border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300"
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(clampedPage + 1)}
        disabled={disabled || clampedPage === pageCount}
        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300"
      >
        Next
      </button>
      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
        <span>Go to</span>
        <input
          key={clampedPage}
          type="number"
          min={1}
          max={pageCount}
          defaultValue={clampedPage}
          onBlur={(event) => {
            const value = Number(event.target.value);
            if (!Number.isNaN(value)) {
              onPageChange(Math.min(Math.max(1, value), pageCount));
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const value = Number((event.target as HTMLInputElement).value);
              if (!Number.isNaN(value)) {
                onPageChange(Math.min(Math.max(1, value), pageCount));
              }
            }
          }}
          disabled={disabled}
          className="h-8 w-16 rounded-full border border-slate-200 bg-white px-2 text-center text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-violet-500"
        />
      </div>
    </div>
  );
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
  onPromptUpdated,
  onPromptDeleted,
  freePlanLimit,
  totalPromptCount,
  onRequestUpgrade,
  workspaceControl,
  contextControl,
  addPromptDisabled,
  addPromptDisabledReason,
}: PromptListProps) {
  const pageSizeOptions = useMemo(() => [9, 18, 27], []);
  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!pageSizeOptions.includes(pageSize)) {
      setPageSize(pageSizeOptions[0]);
    }
  }, [pageSizeOptions, pageSize]);

  const pageCount = Math.max(1, Math.ceil(prompts.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  useEffect(() => {
    setCurrentPage(1);
  }, [prompts, pageSize]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, Math.max(1, pageCount)));
  }, [pageCount]);

  const visiblePrompts = prompts.slice(startIndex, endIndex);
  const showEmptyState = !loading && prompts.length === 0;
  const showSkeletonGrid = loading && prompts.length === 0;

  const limit = freePlanLimit ?? 0;
  const promptCount = totalPromptCount ?? prompts.length;
  const isOverLimit = limit > 0 && promptCount >= limit;
  const remaining = limit > 0 ? Math.max(limit - promptCount, 0) : 0;
  const usageProgress =
    limit > 0 ? Math.min(100, Math.round((promptCount / limit) * 100)) : 0;
  const showUsageBanner =
    limit > 0 && (promptCount >= Math.ceil(limit * 0.5) || isOverLimit);

  const addPromptLabel = isOverLimit ? "Upgrade to add more" : "＋ Add Prompt";
  const addPromptClasses = isOverLimit
    ? "inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/60 dark:bg-amber-400 dark:hover:bg-amber-300 dark:focus:ring-amber-400/60"
    : "inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-500/60";

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-slate-900/50">
        <div className="flex flex-wrap items-center gap-3">
          {workspaceControl ? (
            <div className="flex items-center gap-2">{workspaceControl}</div>
          ) : null}
          <SearchInput
            value={searchValue}
            onChange={onSearchInputChange}
            onDebouncedChange={onSearchDebouncedChange}
          />
          <div className="ml-auto flex items-center gap-3">
            {contextControl ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {contextControl}
              </div>
            ) : null}
            <button
              type="button"
              onClick={onAddPrompt}
              // className={addPromptClasses}
              disabled={addPromptDisabled}
              title={addPromptDisabled ? addPromptDisabledReason : undefined}
              className={addPromptClasses}
              aria-haspopup="dialog"
              aria-label={addPromptLabel}
              aria-disabled={isOverLimit}
            >
              {addPromptLabel}
            </button>
          </div>
        </div>
        <TagFilter
          options={availableTags}
          selected={selectedTags}
          onChange={onTagChange}
        />
        {showUsageBanner ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-purple-200 bg-purple-50/70 p-4 dark:border-purple-500/40 dark:bg-purple-500/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-200">
                  {isOverLimit
                    ? "Starter plan limit reached"
                    : `Starter plan usage: ${promptCount}/${limit}`}
                </p>
                <p className="text-xs text-purple-700/80 dark:text-purple-200/80">
                  {isOverLimit
                    ? "Upgrade to keep creating prompts without restrictions."
                    : `You have ${remaining} prompt${
                        remaining === 1 ? "" : "s"
                      } left before hitting the limit.`}
                  : `You have ${remaining} prompt${remaining === 1 ? "" : "s"}{" "}
                  left before hitting the limit.`
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestUpgrade}
                className="inline-flex items-center justify-center rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400/60 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus:ring-purple-500/60"
              >
                View plans
              </button>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-purple-200/70 dark:bg-purple-500/30">
              <div
                className="h-full rounded-full bg-purple-600 transition-all dark:bg-purple-300"
                style={{ width: `${usageProgress}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50/80 p-10 text-center shadow-sm dark:border-red-500/40 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-200">
            {error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/60 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/20 dark:focus:ring-red-500/60"
          >
            Try again
          </button>
        </div>
      ) : showEmptyState ? (
        <EmptyState onAction={onAddPrompt} actionLabel="Add Prompt" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {showSkeletonGrid
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} />
                ))
              : visiblePrompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onUpdated={onPromptUpdated}
                    onDeleted={onPromptDeleted}
                  />
                ))}
            {loading && prompts.length > 0
              ? Array.from({ length: Math.min(3, pageSize) }).map(
                  (_, index) => <SkeletonCard key={`loading-${index}`} />
                )
              : null}
          </div>

          {prompts.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/70 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Page <strong>{safePage}</strong> of{" "}
                  <strong>{pageCount}</strong>
                </span>
                <span>({prompts.length} prompts)</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>Per page</span>
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                    }}
                    disabled={loading}
                    className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-violet-500"
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <PaginationControls
                  currentPage={safePage}
                  pageCount={pageCount}
                  disabled={loading}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
