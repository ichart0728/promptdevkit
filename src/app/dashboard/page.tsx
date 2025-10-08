"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CreatePromptDialog } from "@/components/prompts/CreatePromptDialog";
import { PromptList } from "@/components/prompts/PromptList";
import { UpgradePlanDialog } from "@/components/prompts/UpgradePlanDialog";
import { WorkspaceSwitcher } from "@/components/prompts/WorkspaceSwitcher";
import { getPrompts, getTeams } from "@/lib/api";
import { normalizeTag } from "@/lib/tag";
import { PromptWithTags } from "@/types/prompt";
import { TeamSummary } from "@/types/team";
import {
  WorkspaceContext,
  WorkspaceType,
  isTeamWorkspace,
} from "@/types/workspace";

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
  const initialWorkspace: WorkspaceType =
    searchParams.get("workspace") === "team" ? "team" : "personal";
  const initialTeamId =
    initialWorkspace === "team" ? searchParams.get("teamId") ?? "all" : "all";

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
  const [workspaceType, setWorkspaceType] =
    useState<WorkspaceType>(initialWorkspace);
  const [teamScope, setTeamScope] = useState<string>(
    initialWorkspace === "team" ? initialTeamId : "all"
  );
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  const requestRef = useRef(0);
  const workspaceContext = useMemo<WorkspaceContext>(() => {
    if (workspaceType === "team") {
      return {
        type: "team",
        teamId: teamScope !== "all" ? teamScope : undefined,
      } as const;
    }
    return { type: "personal" } as const;
  }, [workspaceType, teamScope]);

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

  const promptMatchesWorkspaceSelection = useCallback(
    (item: PromptWithTags) => {
      const isTeamPrompt = Boolean(item.teamId);
      if (isTeamWorkspace(workspaceContext)) {
        if (!isTeamPrompt) {
          return false;
        }
        if (
          workspaceContext.teamId &&
          item.teamId !== workspaceContext.teamId
        ) {
          return false;
        }
        return true;
      }
      return !isTeamPrompt;
    },
    [workspaceContext]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedTags(selectedTags);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [selectedTags]);

  useEffect(() => {
    let isMounted = true;
    setTeamsLoading(true);
    setTeamsError(null);
    getTeams()
      .then((data) => {
        if (!isMounted) return;
        setTeams(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setTeamsError(
          err instanceof Error ? err.message : "Failed to load teams."
        );
        setTeams([]);
      })
      .finally(() => {
        if (isMounted) {
          setTeamsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (workspaceType === "personal") {
      setTeamScope((current) => (current === "all" ? current : "all"));
      return;
    }

    if (teamsLoading) return;

    if (teams.length === 0) {
      setTeamScope("all");
      return;
    }

    setTeamScope((current) => {
      if (current !== "all" && teams.some((team) => team.id === current)) {
        return current;
      }
      if (current === "all" && teams.length === 1) {
        return teams[0].id;
      }
      if (current !== "all" && !teams.some((team) => team.id === current)) {
        return teams[0].id;
      }
      return current;
    });
  }, [workspaceType, teams, teamsLoading]);

  useEffect(() => {
    const paramsSearch = searchParams.get("q") ?? "";
    const paramsTags = sortTags(
      searchParams.getAll("tag").map(normalizeTag).filter(Boolean)
    );
    const paramsWorkspace: WorkspaceType =
      searchParams.get("workspace") === "team" ? "team" : "personal";
    const paramsTeamScope =
      paramsWorkspace === "team" ? searchParams.get("teamId") ?? "all" : "all";

    setSearchInput((prev) => (prev === paramsSearch ? prev : paramsSearch));
    setSearchTerm((prev) => (prev === paramsSearch ? prev : paramsSearch));
    setSelectedTags((prev) =>
      arraysEqual(prev, paramsTags) ? prev : paramsTags
    );
    setDebouncedTags((prev) =>
      arraysEqual(prev, paramsTags) ? prev : paramsTags
    );
    setWorkspaceType((prev) =>
      prev === paramsWorkspace ? prev : paramsWorkspace
    );
    setTeamScope((prev) => (prev === paramsTeamScope ? prev : paramsTeamScope));
  }, [searchParams]);

  const loadPrompts = useCallback(
    async (query: string, tags: string[]) => {
      const requestId = ++requestRef.current;
      setLoading(true);
      setError(null);
      try {
        const data = await getPrompts({
          workspace: workspaceContext,
          q: query || undefined,
          tags,
        });
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
    [buildAvailableTags, workspaceContext]
  );

  useEffect(() => {
    loadPrompts(searchTerm, debouncedTags);
  }, [loadPrompts, searchTerm, debouncedTags, workspaceContext]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    debouncedTags.forEach((tag) => {
      if (tag) params.append("tag", tag);
    });
    params.set("workspace", workspaceType);
    if (workspaceType === "team" && teamScope !== "all") {
      params.set("teamId", teamScope);
    }
    const next = params.toString();
    const current = searchParams.toString();
    if (next === current) return;
    router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
  }, [
    pathname,
    router,
    searchTerm,
    debouncedTags,
    workspaceType,
    teamScope,
    searchParams,
  ]);

  const handleRetry = useCallback(() => {
    loadPrompts(searchTerm, debouncedTags);
  }, [loadPrompts, searchTerm, debouncedTags]);

  const handlePromptCreated = useCallback(
    (prompt: PromptWithTags) => {
      setPrompts((current) => {
        if (!promptMatchesWorkspaceSelection(prompt)) {
          return current;
        }
        const filtered = current.filter((item) => item.id !== prompt.id);
        const next = promptMatchesFilters(prompt, searchTerm, debouncedTags)
          ? sortByUpdated([prompt, ...filtered])
          : sortByUpdated(filtered);
        setAvailableTags(buildAvailableTags(next, debouncedTags));
        return next;
      });
      setError(null);
    },
    [
      debouncedTags,
      searchTerm,
      buildAvailableTags,
      promptMatchesWorkspaceSelection,
    ]
  );

  const handlePromptUpdated = useCallback(
    (updated: PromptWithTags) => {
      setPrompts((current) => {
        const filtered = current.filter((item) => item.id !== updated.id);
        const matchesWorkspace = promptMatchesWorkspaceSelection(updated);
        const matchesFilters = promptMatchesFilters(
          updated,
          searchTerm,
          debouncedTags
        );
        const next =
          matchesWorkspace && matchesFilters
            ? sortByUpdated([updated, ...filtered])
            : sortByUpdated(filtered);
        setAvailableTags(buildAvailableTags(next, debouncedTags));
        return next;
      });
    },
    [
      debouncedTags,
      searchTerm,
      buildAvailableTags,
      promptMatchesWorkspaceSelection,
    ]
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

  const workspaceSwitcherControl = (
    <WorkspaceSwitcher
      value={workspaceType}
      onChange={(next) => {
        setWorkspaceType(next);
        if (next === "personal") {
          setTeamScope("all");
        }
      }}
    />
  );

  const teamSelection =
    workspaceType === "team" ? (
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Team
          </span>
          <select
            value={teamScope}
            onChange={(event) => setTeamScope(event.target.value)}
            disabled={teamsLoading || teams.length === 0}
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-violet-500"
          >
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        {teamsLoading ? (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Loading teams…
          </span>
        ) : teamsError ? (
          <span className="text-[11px] text-red-500">{teamsError}</span>
        ) : teams.length === 0 ? (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            No team workspace available.
          </span>
        ) : null}
      </div>
    ) : null;

  const selectedTeamExists =
    workspaceType === "team" && teamScope !== "all"
      ? teams.some((team) => team.id === teamScope)
      : false;

  const addPromptDisabled =
    workspaceType === "team" &&
    (teamsLoading ||
      Boolean(teamsError) ||
      teamScope === "all" ||
      !selectedTeamExists);

  const addPromptDisabledReason =
    workspaceType === "team"
      ? teamsLoading
        ? "チーム情報を読み込み中です"
        : teamsError
        ? "チーム情報の取得に失敗しました"
        : teamScope === "all"
        ? "チームを選択してください"
        : !selectedTeamExists
        ? teams.length === 0
          ? "利用可能なチームがありません"
          : "選択したチームへのアクセスがありません"
        : undefined
      : undefined;

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
          workspaceControl={workspaceSwitcherControl}
          contextControl={teamSelection}
          addPromptDisabled={addPromptDisabled}
          addPromptDisabledReason={addPromptDisabledReason}
        />
      </div>
      <CreatePromptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handlePromptCreated}
        workspace={workspaceContext}
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
