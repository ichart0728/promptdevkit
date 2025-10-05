"use client";

import { useEffect, useState } from "react";

import { deletePrompt } from "@/lib/api";
import { formatSnippet, formatUpdatedAt } from "@/lib/format";
import { PromptWithTags } from "@/types/prompt";

import { DeletePromptDialog } from "./DeletePromptDialog";
import { EditPromptDialog } from "./EditPromptDialog";
import { PromptHistoryDialog } from "./PromptHistoryDialog";

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

export function PromptCard({ prompt, onUpdated, onDeleted }: PromptCardProps) {
  const [promptData, setPromptData] = useState<PromptWithTags>(prompt);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setPromptData(prompt);
  }, [prompt]);

  const tags = promptData.tags.map(({ tag }) => tag.name.toLowerCase());

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

  return (
    <>
      <article
        className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-violet-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/40 dark:hover:border-violet-500/60"
        aria-label={promptData.title}
      >
        <div className="flex flex-col gap-3">
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
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
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label="Copy prompt body"
              >
                {copyState === "copied" ? "Copied" : copyState === "error" ? "Retry" : "Copy"}
              </button>
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label="View prompt history"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60"
                aria-label="Edit prompt"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="rounded-full border border-red-200 bg-white/70 px-3 py-1 text-xs font-medium text-red-600 transition hover:border-red-300 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 dark:border-red-500/40 dark:bg-slate-900/60 dark:text-red-300 dark:hover:border-red-500 dark:hover:text-red-200 dark:focus:ring-red-500/60"
                aria-label="Delete prompt"
              >
                Delete
              </button>
            </div>
          </header>
          <p
            className="text-sm text-slate-600 transition-colors dark:text-slate-300"
            style={snippetStyle}
          >
            {formatSnippet(promptData.body)}
          </p>
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
    </>
  );
}
