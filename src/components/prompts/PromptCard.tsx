"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { deletePrompt } from "@/lib/api";
import { formatUpdatedAt } from "@/lib/format";
import { PromptWithTags } from "@/types/prompt";

import { DeletePromptDialog } from "./DeletePromptDialog";
import { EditPromptDialog } from "./EditPromptDialog";
import { PromptHistoryDialog } from "./PromptHistoryDialog";
import { PromptCommentsDialog } from "./PromptCommentsDialog";
import { PromptDetailsDialog } from "./PromptDetailsDialog";

type PromptCardProps = {
  prompt: PromptWithTags;
  onUpdated: (prompt: PromptWithTags) => void | Promise<void>;
  onDeleted: (promptId: string) => void | Promise<void>;
};

const MAX_VISIBLE_TAGS = 6;
const BODY_LINE_HEIGHT_REM = 1.5;
const BODY_VISIBLE_LINES = 3;
const BODY_MAX_HEIGHT = `calc(${BODY_LINE_HEIGHT_REM}rem * ${BODY_VISIBLE_LINES + 0.5})`;
const NOTES_LINE_HEIGHT_REM = 1.25;
const NOTES_VISIBLE_LINES = 3;
const NOTES_MAX_HEIGHT = `calc(${NOTES_LINE_HEIGHT_REM}rem * ${NOTES_VISIBLE_LINES + 0.5})`;
const TAG_ROW_HEIGHT_REM = 2;
const TAG_VISIBLE_ROWS = 2;
const TAG_MAX_HEIGHT = `calc(${TAG_ROW_HEIGHT_REM}rem * ${TAG_VISIBLE_ROWS + 0.5})`;

const titleStyle = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical" as const,
  WebkitLineClamp: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  wordBreak: "break-word" as const,
};

export function PromptCard({ prompt, onUpdated, onDeleted }: PromptCardProps) {
  const [promptData, setPromptData] = useState<PromptWithTags>(prompt);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setPromptData(prompt);
  }, [prompt]);

  const tags = promptData.tags.map(({ tag }) => tag.name.toLowerCase());
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const remainingTagCount = Math.max(0, tags.length - visibleTags.length);
  const commentCount = promptData.commentCount ?? 0;
  const notesContent = promptData.notes ?? "";

  const [isBodyOverflowing, setIsBodyOverflowing] = useState(false);
  const [isNotesOverflowing, setIsNotesOverflowing] = useState(false);

  const bodyContainerRef = useRef<HTMLDivElement | null>(null);
  const notesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = bodyContainerRef.current;
    if (!element) {
      setIsBodyOverflowing(false);
      return;
    }

    const update = () => {
      const target = bodyContainerRef.current;
      if (!target) return;
      setIsBodyOverflowing(target.scrollHeight - target.clientHeight > 1);
    };

    update();
    const handleResize = () => update();
    window.addEventListener("resize", handleResize);

    let raf = window.requestAnimationFrame(update);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => update());
      observer.observe(element);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer?.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, [promptData.body]);

  useEffect(() => {
    if (!notesContent) {
      setIsNotesOverflowing(false);
      return;
    }

    const element = notesContainerRef.current;
    if (!element) {
      setIsNotesOverflowing(false);
      return;
    }

    const update = () => {
      const target = notesContainerRef.current;
      if (!target) return;
      setIsNotesOverflowing(target.scrollHeight - target.clientHeight > 1);
    };

    update();
    const handleResize = () => update();
    window.addEventListener("resize", handleResize);

    let raf = window.requestAnimationFrame(update);
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => update());
      observer.observe(element);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer?.disconnect();
      window.cancelAnimationFrame(raf);
    };
  }, [notesContent]);

  const copyLabel =
    copyState === "copied"
      ? "Prompt copied"
      : copyState === "error"
      ? "Copy failed, retry"
      : "Copy prompt body";
  const historyLabel = "View prompt history";
  const commentsLabel =
    commentCount === 1 ? "View 1 comment" : `View ${commentCount} comments`;
  const editLabel = "Edit prompt";
  const deleteLabel = "Delete prompt";
  const actionButtonClass =
    "inline-flex h-8 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-600 transition hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-500 dark:hover:text-violet-300 dark:focus:ring-violet-500/60";
  const dangerButtonClass =
    "inline-flex h-8 items-center justify-center rounded-full border border-red-200 bg-white/70 text-red-600 transition hover:border-red-300 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-400/60 dark:border-red-500/40 dark:bg-slate-900/60 dark:text-red-300 dark:hover:border-red-500 dark:hover:text-red-200 dark:focus:ring-red-500/60";

  const handleCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.defaultPrevented) return;
    if (event.key === "Enter" || event.key === " ") {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      setDetailsOpen(true);
    }
  };

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

  const handleCommentCountChange = (count: number) => {
    setPromptData((current) => ({ ...current, commentCount: count }));
  };

  const CopyIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a9.5 9.5 0 1 1-9.5-9.5 9.5 9.5 0 0 1 9.5 9.5Z" />
      <path d="m15.5 9.5-4.5 4.5-2-2" />
    </svg>
  );

  const ErrorIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10Z" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );

  const HistoryIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8v5l3 2" />
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 4.5V9h4.5" />
    </svg>
  );

  const CommentIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 8h10" />
      <path d="M7 12h6" />
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
    </svg>
  );

  const EditIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3l-11 11L7 18l.5-1.5 11-11Z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
        className="group relative flex h-[340px] w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 hover:border-violet-400 hover:shadow-[0_0_25px_rgba(139,92,246,0.25)] dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/40 dark:focus-visible:ring-violet-500/60 dark:hover:border-violet-500/60 dark:hover:shadow-[0_0_25px_rgba(129,140,248,0.35)]"
        aria-label={`Open details for ${promptData.title}`}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        onClick={() => setDetailsOpen(true)}
        onKeyDown={handleCardKeyDown}
      >
        <div className="flex flex-col gap-3">
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCopy();
                }}
                className={`${actionButtonClass} w-8`}
                aria-label={copyLabel}
                title={copyLabel}
              >
                {copyState === "copied" ? (
                  <CheckIcon />
                ) : copyState === "error" ? (
                  <ErrorIcon />
                ) : (
                  <CopyIcon />
                )}
                <span className="sr-only">{copyLabel}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setHistoryOpen(true);
                }}
                className={`${actionButtonClass} w-8`}
                aria-label={historyLabel}
                title={historyLabel}
              >
                <HistoryIcon />
                <span className="sr-only">{historyLabel}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setCommentsOpen(true);
                }}
                className={`${actionButtonClass} min-w-[2.5rem] gap-1 px-2`}
                aria-label={commentsLabel}
                title={commentsLabel}
              >
                <CommentIcon />
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                  {commentCount}
                </span>
                <span className="sr-only">{commentsLabel}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditOpen(true);
                }}
                className={`${actionButtonClass} w-8`}
                aria-label={editLabel}
                title={editLabel}
              >
                <EditIcon />
                <span className="sr-only">{editLabel}</span>
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteOpen(true);
                }}
                className={`${dangerButtonClass} w-8`}
                aria-label={deleteLabel}
                title={deleteLabel}
              >
                <TrashIcon />
                <span className="sr-only">{deleteLabel}</span>
              </button>
            </div>
            <div className="min-w-0 flex flex-col gap-1">
              <h3
                className="text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100"
                style={titleStyle}
                title={promptData.title}
              >
                {promptData.title}
              </h3>
              <time
                dateTime={promptData.updatedAt}
                className="text-xs font-medium text-slate-500 transition-colors dark:text-slate-400"
              >
                {formatUpdatedAt(promptData.updatedAt)}
              </time>
            </div>
          </header>
          <div
            ref={bodyContainerRef}
            className="relative overflow-hidden"
            style={{ maxHeight: BODY_MAX_HEIGHT }}
          >
            <p
              className="m-0 whitespace-pre-wrap break-words text-sm text-slate-600 transition-colors dark:text-slate-300"
              style={{ lineHeight: `${BODY_LINE_HEIGHT_REM}rem` }}
            >
              {promptData.body}
            </p>
            {isBodyOverflowing ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80" />
            ) : null}
          </div>
          {notesContent ? (
            <div
              ref={notesContainerRef}
              className="relative overflow-hidden rounded-xl bg-slate-100/70 p-3 text-xs text-slate-600 transition-colors dark:bg-slate-800/60 dark:text-slate-300"
              style={{ maxHeight: NOTES_MAX_HEIGHT }}
              title={promptData.notes ?? undefined}
            >
              <p
                className="m-0 whitespace-pre-wrap break-words"
                style={{ lineHeight: `${NOTES_LINE_HEIGHT_REM}rem` }}
              >
                {notesContent}
              </p>
              {isNotesOverflowing ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-slate-100/95 via-slate-100/70 to-transparent dark:from-slate-900/95 dark:via-slate-900/70" />
              ) : null}
            </div>
          ) : null}
        </div>
        {visibleTags.length ? (
          <footer className="mt-4">
            <div
              className="relative overflow-hidden"
              style={{ maxHeight: TAG_MAX_HEIGHT }}
            >
              <div
                className="relative flex flex-wrap gap-2 pr-2"
                style={{ maxHeight: TAG_MAX_HEIGHT }}
              >
                {visibleTags.map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="relative z-0 max-w-[9rem] rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 transition group-hover:bg-violet-200/90 dark:bg-violet-500/10 dark:text-violet-200 dark:group-hover:bg-violet-500/20"
                    title={tag}
                  >
                    <span className="inline-block truncate">{tag}</span>
                  </span>
                ))}
                {remainingTagCount > 0 ? (
                  <span className="relative z-20 rounded-full bg-violet-200/60 px-3 py-1 text-xs font-semibold lowercase text-violet-700 transition group-hover:bg-violet-200/90 dark:bg-violet-500/20 dark:text-violet-100">
                    +{remainingTagCount} more…
                  </span>
                ) : null}
              </div>
              {remainingTagCount > 0 ? (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 z-10" />
              ) : null}
            </div>
          </footer>
        ) : null}
      </article>
      <PromptDetailsDialog
        prompt={promptData}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onOpenComments={() => setCommentsOpen(true)}
      />

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
      <PromptHistoryDialog
        prompt={promptData}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
      <PromptCommentsDialog
        prompt={promptData}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        onCommentCountChange={handleCommentCountChange}
      />
    </>
  );
}
