"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CreatePromptDialog } from "@/components/prompts/CreatePromptDialog";
import { PromptList } from "@/components/prompts/PromptList";
import { UpgradePlanDialog } from "@/components/prompts/UpgradePlanDialog";
import { getPrompts } from "@/lib/api";
import { normalizeTag } from "@/lib/tag";
import { PromptWithTags } from "@/types/prompt";

const FREE_PLAN_PROMPT_LIMIT = 25;

const sortByUpdated = (items: PromptWithTags[]) =>
  [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

const sortTags = (values: string[]) =>
  [...values].sort((a, b) => a.localeCompare(b));

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sortedA = sortTags(a);
  const sortedB = sortTags(b);
  return sortedA.every((value, index) => value === sortedB[index]);
};

const promptMatchesFilters = (
  prompt: PromptWithTags,
  query: string,
  tags: string[]
): boolean => {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery) {
    const haystack = `${prompt.title} ${prompt.body} ${
      prompt.notes ?? ""
    }`.toLowerCase();
    if (!haystack.includes(normalizedQuery)) {
      return false;
    }
  }
  if (tags.length) {
    const promptTags = new Set(
      prompt.tags.map(({ tag }) => normalizeTag(tag.name)).filter(Boolean)
    );
    return tags.every((tag) => promptTags.has(tag));
  }
  return true;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialSearch = searchParams.get("q") ?? "";
  const initialTags = useMemo(
    () =>
      sortTags(searchParams.getAll("tag").map(normalizeTag).filter(Boolean)),
    [searchParams]
  );

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [debouncedTags, setDebouncedTags] = useState<string[]>(initialTags);
  const [prompts, setPrompts] = useState<PromptWithTags[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>(
    Array.from(new Set(initialTags)).sort((a, b) => a.localeCompare(b))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const requestRef = useRef(0);

  const buildAvailableTags = useCallback(
    (items: PromptWithTags[], baseTags: string[] = []) => {
      const tagSet = new Set(baseTags);
      items.forEach((item) => {
        item.tags.forEach(({ tag }) => {
          const normalized = normalizeTag(tag.name);
          if (normalized) tagSet.add(normalized);
        });
      });
      return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    },
    []
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedTags(selectedTags);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [selectedTags]);

  useEffect(() => {
    const paramsSearch = searchParams.get("q") ?? "";
    const paramsTags = sortTags(
      searchParams.getAll("tag").map(normalizeTag).filter(Boolean)
    );

    setSearchInput((prev) => (prev === paramsSearch ? prev : paramsSearch));
    setSearchTerm((prev) => (prev === paramsSearch ? prev : paramsSearch));
    setSelectedTags((prev) =>
      arraysEqual(prev, paramsTags) ? prev : paramsTags
    );
    setDebouncedTags((prev) =>
      arraysEqual(prev, paramsTags) ? prev : paramsTags
    );
  }, [searchParams]);

  const loadPrompts = useCallback(
    async (query: string, tags: string[]) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await getPrompts(query || undefined, tags);
        if (requestId !== requestRef.current) return;
        const sorted = sortByUpdated(data);
        setPrompts(sorted);
        setAvailableTags(buildAvailableTags(sorted, tags));
      } catch (err) {
        if (requestId !== requestRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to load prompts."
        );
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
        }
      }
    },
    [buildAvailableTags]
  );

  useEffect(() => {
    loadPrompts(searchTerm, debouncedTags);
  }, [loadPrompts, searchTerm, debouncedTags]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    debouncedTags.forEach((tag) => {
      if (tag) params.append("tag", tag);
    });
    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }, [pathname, router, searchTerm, debouncedTags, searchParams]);

  const handleRetry = useCallback(() => {
    loadPrompts(searchTerm, debouncedTags);
  }, [loadPrompts, searchTerm, debouncedTags]);

  const handlePromptCreated = useCallback(
    (prompt: PromptWithTags) => {
      setPrompts((current) => {
        const filtered = current.filter((item) => item.id !== prompt.id);
        const next = promptMatchesFilters(prompt, searchTerm, debouncedTags)
          ? sortByUpdated([prompt, ...filtered])
          : sortByUpdated(filtered);
        setAvailableTags(buildAvailableTags(next, debouncedTags));
        return next;
      });
      setError(null);
    },
    [debouncedTags, searchTerm, buildAvailableTags]
  );

  const handlePromptUpdated = useCallback(
    (updated: PromptWithTags) => {
      setPrompts((current) => {
        const filtered = current.filter((item) => item.id !== updated.id);
        const next = promptMatchesFilters(updated, searchTerm, debouncedTags)
          ? sortByUpdated([updated, ...filtered])
          : sortByUpdated(filtered);
        setAvailableTags(buildAvailableTags(next, debouncedTags));
        return next;
      });
    },
    [debouncedTags, searchTerm, buildAvailableTags]
  );

  const handlePromptDeleted = useCallback(
    (promptId: string) => {
      setPrompts((current) => {
        const next = sortByUpdated(
          current.filter((item) => item.id !== promptId)
        );
        setAvailableTags(buildAvailableTags(next, debouncedTags));
        return next;
      });
    },
    [debouncedTags, buildAvailableTags]
  );

  const handleAddPrompt = () => {
    if (prompts.length >= FREE_PLAN_PROMPT_LIMIT) {
      setUpgradeDialogOpen(true);
      return;
    }
    setDialogOpen(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <PromptList
          prompts={prompts}
          loading={loading}
          error={error}
          searchValue={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchDebouncedChange={setSearchTerm}
          selectedTags={selectedTags}
          availableTags={availableTags}
          onTagChange={setSelectedTags}
          onRetry={handleRetry}
          onAddPrompt={handleAddPrompt}
          onPromptUpdated={handlePromptUpdated}
          onPromptDeleted={handlePromptDeleted}
          freePlanLimit={FREE_PLAN_PROMPT_LIMIT}
          onRequestUpgrade={() => setUpgradeDialogOpen(true)}
        />
      </div>
      <CreatePromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handlePromptCreated}
      />
      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentUsage={prompts.length}
        usageLimit={FREE_PLAN_PROMPT_LIMIT}
      />
    </main>
  );
}
