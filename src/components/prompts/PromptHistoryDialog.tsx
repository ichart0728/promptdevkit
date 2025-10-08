"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode, UIEvent } from "react";

import { deletePromptVersion, getPromptVersions } from "@/lib/api";
import { formatUpdatedAt } from "@/lib/format";
import { PromptVersion, PromptWithTags } from "@/types/prompt";
import { WorkspaceContext, isTeamWorkspace } from "@/types/workspace";

const focusableSelector =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

const ROW_HEIGHT = 24;
const OVERSCAN = 12;

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 6 12 12" />
    <path d="m6 18 12-12" />
  </svg>
);

type PromptHistoryDialogProps = {
  prompt: PromptWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: WorkspaceContext;
};

type SplitDiffRow = {
  previousLine: string | null;
  currentLine: string | null;
  type: "added" | "removed" | "unchanged";
};

const currentLineClasses: Record<SplitDiffRow["type"], string> = {
  added:
    "border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200",
  removed: "border-transparent text-slate-700 dark:text-slate-300",
  unchanged: "border-transparent text-slate-700 dark:text-slate-300",
};

const previousLineClasses: Record<SplitDiffRow["type"], string> = {
  added: "border-transparent text-slate-700 dark:text-slate-300",
  removed:
    "border-red-200 bg-red-500/10 text-red-600 dark:border-red-500/30 dark:bg-red-500/20 dark:text-red-200",
  unchanged: "border-transparent text-slate-700 dark:text-slate-300",
};

const buildSplitDiff = (current: string, previous: string): SplitDiffRow[] => {
  const previousLines = previous.split(/\r?\n/);
  const currentLines = current.split(/\r?\n/);
  const m = previousLines.length;
  const n = currentLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      if (previousLines[i] === currentLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rows: SplitDiffRow[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (previousLines[i] === currentLines[j]) {
      rows.push({
        previousLine: previousLines[i],
        currentLine: currentLines[j],
        type: "unchanged",
      });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({
        previousLine: previousLines[i],
        currentLine: null,
        type: "removed",
      });
      i += 1;
    } else {
      rows.push({
        previousLine: null,
        currentLine: currentLines[j],
        type: "added",
      });
      j += 1;
    }
  }

  while (i < m) {
    rows.push({
      previousLine: previousLines[i],
      currentLine: null,
      type: "removed",
    });
    i += 1;
  }

  while (j < n) {
    rows.push({
      previousLine: null,
      currentLine: currentLines[j],
      type: "added",
    });
    j += 1;
  }

  return rows;
};

export function PromptHistoryDialog({
  prompt,
  open,
  onOpenChange,
  workspace,
}: PromptHistoryDialogProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const syncPanelRef = useRef<HTMLDivElement | null>(null);

  const [panelHeight, setPanelHeight] = useState(400);
  const [pastScrollTop, setPastScrollTop] = useState(0);
  const isTeamPrompt = isTeamWorkspace(workspace);

  const getAuthorLabel = useCallback((user: PromptVersion["createdBy"]) => {
    return user?.name ?? user?.email ?? "Unknown member";
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    lastActiveElement.current = document.activeElement as HTMLElement | null;

    const focusInitialField = () => {
      const container = containerRef.current;
      if (!container) return;
      const focusables =
        container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length > 0) {
        window.setTimeout(() => focusables[0]?.focus(), 0);
      }
    };

    focusInitialField();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key === "Tab") {
        const container = containerRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => !el.hasAttribute("data-focus-guard"));
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
  }, [handleClose, open]);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setDeletingId(null);

    getPromptVersions(prompt.id, workspace)
      .then((data) => {
        if (!isMounted) return;
        setVersions(data);
        setSelectedId((current) => current ?? data[0]?.id ?? null);
      })
      .catch((fetchError: unknown) => {
        if (!isMounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load history."
        );
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, prompt.id, workspace]);

  const handleDeleteVersion = async (versionId: string) => {
    setDeletingId(versionId);
    try {
      await deletePromptVersion(prompt.id, versionId, workspace);
      setVersions((current) => {
        const next = current.filter((version) => version.id !== versionId);
        setSelectedId((selected) =>
          selected === versionId ? next[0]?.id ?? null : selected
        );
        return next;
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete history entry."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const selectedVersion =
    versions.find((version) => version.id === selectedId) ?? null;

  const titleRows = useMemo(() => {
    if (!selectedVersion) return [] as SplitDiffRow[];
    return buildSplitDiff(prompt.title, selectedVersion.title);
  }, [prompt.title, selectedVersion]);

  const bodyRows = useMemo(() => {
    if (!selectedVersion) return [] as SplitDiffRow[];
    return buildSplitDiff(prompt.body, selectedVersion.body);
  }, [prompt.body, selectedVersion]);

  const promptTags = useMemo(
    () => prompt.tags.map(({ tag }) => tag.name),
    [prompt.tags]
  );

  useEffect(() => {
    const element = syncPanelRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setPanelHeight(entry.contentRect.height);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    setPastScrollTop(0);
    if (syncPanelRef.current) {
      syncPanelRef.current.scrollTop = 0;
    }
  }, [selectedId]);

  const height = panelHeight || 1;
  const totalRows = bodyRows.length;
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(
    0,
    Math.floor(pastScrollTop / ROW_HEIGHT) - OVERSCAN
  );
  const endIndex = Math.min(totalRows, startIndex + visibleCount);
  const topSpacer = startIndex * ROW_HEIGHT;
  const bottomSpacer = Math.max(
    0,
    totalRows * ROW_HEIGHT - endIndex * ROW_HEIGHT
  );

  const handleSharedScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    setPastScrollTop(target.scrollTop);
  };

  const getLineMarkup = (
    row: SplitDiffRow,
    column: "current" | "previous",
    key: string
  ) => {
    const classes =
      column === "current" ? currentLineClasses : previousLineClasses;
    const line = column === "current" ? row.currentLine : row.previousLine;
    const marker =
      column === "current" && row.type === "added"
        ? "+"
        : column === "previous" && row.type === "removed"
        ? "-"
        : "";
    const content = line === null || line === "" ? " " : line;
    return (
      <div
        key={key}
        className={`flex gap-2 min-w-0 max-w-full whitespace-pre-wrap border px-3 py-1 font-mono text-xs leading-[24px] shadow-sm transition dark:border-transparent ${
          classes[row.type]
        }`}
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        <span className="select-none text-xs font-semibold text-slate-400 dark:text-slate-500">
          {marker}
        </span>
        <span
          className="min-w-0 flex-1 break-words"
          style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
        >
          {content}
        </span>
      </div>
    );
  };

  const renderTitleLines = (
    rows: SplitDiffRow[],
    column: "current" | "previous"
  ) =>
    rows.map((row, index) =>
      getLineMarkup(row, column, `${column}-title-${index}`)
    );

  const renderBodyLines = (
    rows: SplitDiffRow[],
    column: "current" | "previous"
  ) => {
    const totalHeight = rows.length * ROW_HEIGHT;
    const items: ReactNode[] = [];
    for (let idx = startIndex; idx < endIndex; idx += 1) {
      const row = rows[idx];
      items.push(getLineMarkup(row, column, `${column}-body-${idx}`));
    }
    return (
      <div style={{ height: totalHeight }} className="relative">
        <div style={{ height: topSpacer }} />
        {items}
        <div style={{ height: bottomSpacer }} />
      </div>
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-history-heading"
        className="flex h-[80vh] w-full max-w-6xl flex-col gap-4 overflow-hidden rounded-2xl border border-violet-200 bg-white p-6 shadow-2xl shadow-violet-500/20 transition dark:border-violet-500/40 dark:bg-slate-900"
      >
        <header className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="prompt-history-heading"
              className="text-xl font-semibold text-slate-900 dark:text-slate-100"
            >
              Prompt history
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-violet-500/60"
              aria-label="Close"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Compare past versions of this prompt and review previous edits.
          </p>
        </header>

        {error ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-600 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
            {error}
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0">
              <div className="grid h-full min-h-0 grid-cols-[1.1fr_1.5fr_1.6fr] gap-4">
                <aside className="min-w-0 min-h-0 flex h-full flex-col gap-3 overflow-hidden rounded-xl border border-violet-200 bg-white/80 p-4 shadow-inner dark:border-violet-500/30 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      History
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {versions.length}
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                    {loading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Loading history…
                      </p>
                    ) : versions.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No history saved yet.
                      </p>
                    ) : (
                      versions.map((version) => {
                        const isActive = version.id === selectedId;
                        const authorLabel = getAuthorLabel(version.createdBy);
                        const savedLabel = formatUpdatedAt(version.createdAt);
                        return (
                          <div
                            key={version.id}
                            onClick={() => setSelectedId(version.id)}
                            className={`group flex w-full flex-col rounded-xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:focus:ring-violet-500/60 ${
                              isActive
                                ? "border-violet-500 bg-violet-500/10"
                                : "border-violet-100 bg-white/70 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-500/20 dark:bg-slate-900/60 dark:hover:border-violet-500 dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                              <span>Version {version.version}</span>
                              <button
                                type="button"
                                className="rounded-full border border-transparent px-2 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300/60 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-300 dark:hover:border-red-500 dark:hover:bg-red-500/20 dark:focus:ring-red-500/60"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteVersion(version.id);
                                }}
                                disabled={deletingId === version.id}
                              >
                                {deletingId === version.id
                                  ? "Deleting…"
                                  : "Delete"}
                              </button>
                            </div>
                            <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {isTeamPrompt
                                ? `Saved by ${authorLabel} · ${savedLabel}`
                                : `Saved ${savedLabel}`}
                            </span>
                            <p
                              className="mt-2 text-xs text-slate-600 dark:text-slate-300"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {version.body}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </aside>

                <div className="col-span-2 min-w-0 min-h-0 flex h-full flex-col gap-4 rounded-xl border border-violet-200 bg-white/70 p-4 text-sm text-slate-700 shadow-inner dark:border-violet-500/30 dark:bg-slate-900/40 dark:text-slate-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Past version
                      </h3>
                      {selectedVersion ? (
                        <span className="flex flex-col text-right text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span>
                            {isTeamPrompt
                              ? `Saved by ${getAuthorLabel(selectedVersion.createdBy)} · ${formatUpdatedAt(selectedVersion.createdAt)}`
                              : `Saved ${formatUpdatedAt(selectedVersion.createdAt)}`}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        Current prompt
                      </h3>
                      {selectedVersion ? (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Now
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div
                    ref={syncPanelRef}
                    onScroll={handleSharedScroll}
                    className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
                    style={{ scrollbarGutter: "stable" }}
                  >
                    {loading ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Loading history…
                      </p>
                    ) : !selectedVersion ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        History entries will appear here once created.
                      </p>
                    ) : (
                      <div className="grid h-full grid-cols-2 gap-4">
                        <div className="flex min-w-0 max-w-full flex-col gap-4 border-r border-slate-200 pr-4 dark:border-slate-700">
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Title
                            </p>
                            <div className="space-y-1">
                              {renderTitleLines(titleRows, "previous")}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Body
                            </p>
                            <div className="space-y-1">
                              {renderBodyLines(bodyRows, "previous")}
                            </div>
                          </div>
                        </div>
                        <div className="flex min-w-0 max-w-full flex-col gap-4 pl-4">
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Title
                            </p>
                            <div className="space-y-1">
                              {renderTitleLines(titleRows, "current")}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Body
                            </p>
                            <div className="space-y-1">
                              {renderBodyLines(bodyRows, "current")}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {promptTags.length ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {promptTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 dark:bg-violet-500/20 dark:text-violet-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
