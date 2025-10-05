"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PromptForm } from "@/components/prompts/PromptForm";
import { PromptList } from "@/components/prompts/PromptList";
import { RunPanel } from "@/components/prompts/RunPanel";
import { PromptWithTags } from "@/types/prompt";
import { getPrompts } from "@/lib/api";

export default function DashboardPage() {
  const [prompts, setPrompts] = useState<PromptWithTags[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  const loadPrompts = useCallback(async (qValue: string, tagValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPrompts(qValue || undefined, tagValue || undefined);
      setPrompts(data);
      setSelectedPromptId((current) => {
        if (current && data.some((prompt) => prompt.id === current)) {
          return current;
        }
        return data.length > 0 ? data[0].id : null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts("", "");
  }, [loadPrompts]);

  const handleFilterChange = useCallback(
    async (nextQuery: string, nextTag: string) => {
      setQuery(nextQuery);
      setTag(nextTag);
      await loadPrompts(nextQuery, nextTag);
    },
    [loadPrompts]
  );

  const handleRetry = useCallback(() => {
    loadPrompts(query, tag);
  }, [loadPrompts, query, tag]);

  const handleCreated = useCallback(
    async (_prompt: PromptWithTags) => {
      await loadPrompts(query, tag);
    },
    [loadPrompts, query, tag]
  );

  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId]
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Prompt Dashboard</h1>
          <p className="text-sm text-gray-600">
            Manage your prompts, create new ones, and run them with dynamic variables.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div className="flex flex-col gap-6">
            <PromptForm onCreated={handleCreated} />
            <PromptList
              prompts={prompts}
              loading={loading}
              error={error}
              query={query}
              tag={tag}
              selectedId={selectedPromptId}
              onSelect={(prompt) => setSelectedPromptId(prompt.id)}
              onFilterChange={handleFilterChange}
              onRetry={handleRetry}
            />
          </div>
          <RunPanel prompt={selectedPrompt} />
        </div>
      </div>
    </main>
  );
}
