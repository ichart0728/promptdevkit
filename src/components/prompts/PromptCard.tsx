"use client";

import { useEffect, useState } from "react";

import { deletePrompt } from "@/lib/api";
import { formatSnippet, formatUpdatedAt } from "@/lib/format";
import { PromptWithTags } from "@/types/prompt";

import { DeletePromptDialog } from "./DeletePromptDialog";
import { EditPromptDialog } from "./EditPromptDialog";
import { PromptHistoryDialog } from "./PromptHistoryDialog";
import { PromptCommentsDialog } from "./PromptCommentsDialog";

type PromptCardProps = {
  prompt: PromptWithTags;
  onUpdated: (prompt: PromptWithTags) => void | Promise<void>;
  onDeleted: (promptId: string) => void | Promise<void>;
};

const snippetStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 2,
  overflow: "hidden",
};

const notesStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 3,
  overflow: "hidden",
};

export function PromptCard({ prompt, onUpdated, onDeleted }: PromptCardProps) {
  const [promptData, setPromptData] = useState<PromptWithTags>(prompt);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    setPromptData(prompt);
  }, [prompt]);

  const tags = promptData.tags.map(({ tag }) => tag.name.toLowerCase());
  const notesSnippet = promptData.notes ? formatSnippet(promptData.notes, 200) : "";

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptData.body);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = promptData.body;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      console.warn("[prompt:copy] failed", error);
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const handlePromptUpdated = async (updated: PromptWithTags) => {
    setPromptData(updated);
    await onUpdated(updated);
  };

  const handleConfirmDelete = async () => {
    await deletePrompt(promptData.id);
    await onDeleted(promptData.id);
  };

  const CopyIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  const HistoryIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v5l3 2" />
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 4.5V9h4.5" />
    </svg>
  );

  const CommentIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 8h10" />
      <path d="M7 12h6" />
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3l-11 11L7 18l.5-1.5 11-11Z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );

  return (
    <>
      <article
        className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-violet-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/40 dark:hover:border-violet-500/60"
        aria-label={promptData.title}
      >
        <div className="flex flex-col gap-3">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex flex-col gap-1">
              <h3 className="text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100">
                {promptData.title}
              </h3>
              <time
                dateTime={promptData.updatedAt}
                className="text-xs font-medium text-slate-500 transition-colors dark:text-slate-400"
              >
                {formatUpdatedAt(promptData.updatedAt)}
              </time>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label={copyState === "copied" ? "Copied" : "Copy prompt body"}
              >
                <CopyIcon />
                <span className="sr-only">{copyState === "copied" ? "Copied" : copyState === "error" ? "Retry copy" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label="View prompt history"
              >
                <HistoryIcon />
                <span className="sr-only">History</span>
              </button>
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label="View comments"
              >
                <CommentIcon />
                <span className="sr-only">Comments</span>
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover-border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label="Edit prompt"
              >
                <EditIcon />
                <span className="sr-only">Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white/70 text-red-600 transition hover:border-red-300 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 dark:border-red-500/40 dark:bg-slate-900/60 dark:text-red-300 dark:hover:border-red-500 dark:hover:text-red-200 dark:focus:ring-red-500/60"
                aria-label="Delete prompt"
              >
                <TrashIcon />
                <span className="sr-only">Delete</span>
              </button>
            </div>
          </header>
          <p
            className="text-sm text-slate-600 transition-colors dark:text-slate-300"
            style={snippetStyle}
          >
            {formatSnippet(promptData.body)}
          </p>
          {notesSnippet ? (
            <div
              className="rounded-xl bg-slate-100/70 p-3 text-xs text-slate-600 transition-colors dark:bg-slate-800/60 dark:text-slate-300"
              style={notesStyle}
            >
              {notesSnippet}
            </div>
          ) : null}
        </div>
        {tags.length ? (
          <footer className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 transition group-hover:bg-violet-200/90 dark:bg-violet-500/10 dark:text-violet-200 dark:group-hover:bg-violet-500/20"
              >
                {tag}
              </span>
            ))}
          </footer>
        ) : null}
      </article>

      <EditPromptDialog
        prompt={promptData}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handlePromptUpdated}
      />
      <DeletePromptDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        promptTitle={promptData.title}
        onConfirm={handleConfirmDelete}
      />
      <PromptHistoryDialog prompt={promptData} open={historyOpen} onOpenChange={setHistoryOpen} />
      <PromptCommentsDialog
        prompt={promptData}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </>
  );
}
