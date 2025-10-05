"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PromptWithTags } from "@/types/prompt";

type PromptListProps = {
  prompts: PromptWithTags[];
  loading: boolean;
  error: string | null;
  query: string;
  tag: string;
  selectedId?: string | null;
  onSelect: (prompt: PromptWithTags) => void;
  onFilterChange: (q: string, tag: string) => void;
  onRetry: () => void;
};

const SkeletonRow = () => (
  <div className="animate-pulse rounded-md border border-gray-200 p-4">
    <div className="h-4 w-2/3 rounded bg-gray-200" />
    <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
  </div>
);

export function PromptList({
  prompts,
  loading,
  error,
  query,
  tag,
  selectedId,
  onSelect,
  onFilterChange,
  onRetry,
}: PromptListProps) {
  const [qInput, setQInput] = useState(query);
  const [tagInput, setTagInput] = useState(tag);

  useEffect(() => {
    setQInput(query);
  }, [query]);

  useEffect(() => {
    setTagInput(tag);
  }, [tag]);

  const sortedPrompts = useMemo(
    () =>
      [...prompts].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [prompts]
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onFilterChange(qInput.trim(), tagInput.trim().toLowerCase());
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search prompts"
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filter by tag"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value.toLowerCase())}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          Apply
        </button>
      </form>

      <div className="flex-1 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
        {loading && prompts.length > 0 ? (
          <p className="mb-2 text-xs text-gray-500">Loading…</p>
        ) : null}
        {loading && prompts.length === 0 ? (
          <div className="flex flex-col gap-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm"
            >
              Retry
            </button>
          </div>
        ) : sortedPrompts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No prompts yet. Create one to get started.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedPrompts.map((prompt) => {
              const isSelected = prompt.id === selectedId;
              return (
                <li key={prompt.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(prompt)}
                    className={`w-full rounded-md border px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50 ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {prompt.title}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {new Date(prompt.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    {prompt.tags.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prompt.tags.map(({ tag: tagValue }) => (
                          <span
                            key={tagValue.id}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {tagValue.name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
