"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPromptComment, getPromptComments } from "@/lib/api";
import { formatUpdatedAt } from "@/lib/format";
import { PromptComment, PromptWithTags } from "@/types/prompt";
import { WorkspaceContext, isTeamWorkspace } from "@/types/workspace";

const MAX_COMMENT_LENGTH = 2000;

type PromptCommentsDialogProps = {
  prompt: PromptWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentCountChange?: (count: number) => void;
  workspace: WorkspaceContext;
};

type NewCommentState = {
  body: string;
  parentId: string | null;
};

const defaultNewComment: NewCommentState = {
  body: "",
  parentId: null,
};

const sortByCreatedAt = (nodes: PromptComment[]) =>
  [...nodes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

const flattenComments = (nodes: PromptComment[]): PromptComment[] => {
  return nodes.reduce<PromptComment[]>((acc, node) => {
    const replies = node.replies;
    acc.push({ ...node, replies: [] });
    if (replies?.length) {
      acc.push(...flattenComments(replies));
    }
    return acc;
  }, []);
};

const getAuthorLabel = (comment: PromptComment | undefined) =>
  comment?.authorName ?? comment?.authorEmail ?? "Unknown";

export function PromptCommentsDialog({
  prompt,
  open,
  onOpenChange,
  onCommentCountChange,
  workspace,
}: PromptCommentsDialogProps) {
  const [comments, setComments] = useState<PromptComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState<NewCommentState>(defaultNewComment);
  const [replyAnnouncement, setReplyAnnouncement] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commentRefs = useRef<Record<string, HTMLElement | null>>({});
  const isInitialRender = useRef(true);

  const commentMap = useMemo(() => {
    const map = new Map<string, PromptComment>();
    comments.forEach((comment) => {
      map.set(comment.id, comment);
    });
    return map;
  }, [comments]);

  const sortedComments = useMemo(() => sortByCreatedAt(comments), [comments]);
  const isTeamPrompt = isTeamWorkspace(workspace);
  const headerDescription = isTeamPrompt
    ? "Discuss this prompt with your teammates."
    : "Capture personal notes or reminders for this prompt.";

  useEffect(() => {
    if (!open) {
      setComments([]);
      setError(null);
      setNewComment(defaultNewComment);
      setReplyAnnouncement("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getPromptComments(prompt.id, workspace)
      .then((data) => {
        if (!isMounted) return;
        const flattened = sortByCreatedAt(flattenComments(data));
        setComments(flattened);
        onCommentCountChange?.(flattened.length);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load comments.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, prompt.id, onCommentCountChange, workspace]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newComment.body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const created = await createPromptComment(
        prompt.id,
        workspace,
        {
          body: trimmed,
          parentId: newComment.parentId ?? undefined,
        }
      );
      setComments((current) => {
        const next = sortByCreatedAt([...current, { ...created, replies: [] }]);
        onCommentCountChange?.(next.length);
        return next;
      });
      setNewComment(defaultNewComment);
      setError(null);
      setReplyAnnouncement("Comment posted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const replyTarget = newComment.parentId
    ? commentMap.get(newComment.parentId)
    : undefined;

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      if (!newComment.parentId) {
        return;
      }
    }
    if (!newComment.parentId) {
      setReplyAnnouncement("Reply mode cleared.");
      return;
    }
    const authorLabel = getAuthorLabel(replyTarget);
    setReplyAnnouncement(`Replying to ${authorLabel}.`);
  }, [newComment.parentId, replyTarget]);

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!submitting && newComment.body.trim()) {
        formRef.current?.requestSubmit();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setNewComment((prev) => ({ ...prev, parentId: null }));
      textareaRef.current?.focus();
    }
  };

  const handleReply = (comment: PromptComment) => {
    setNewComment((prev) => ({ ...prev, parentId: comment.id }));
    textareaRef.current?.focus();
  };

  const handleScrollToParent = (parentId: string | null | undefined) => {
    if (!parentId) return;
    const node = commentRefs.current[parentId];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
      node.focus({ preventScroll: true });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="flex h-[80vh] w-full max-w-3xl flex-col gap-4 rounded-2xl border border-violet-200 bg-white p-6 shadow-2xl shadow-violet-500/20 transition dark:border-violet-500/40 dark:bg-slate-900">
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Comments
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {headerDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-violet-500/60"
            aria-label="Close comments dialog"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading comments…</p>
          ) : error ? (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No comments yet. Start the conversation below.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedComments.map((comment) => {
                const parent = comment.parentId
                  ? commentMap.get(comment.parentId)
                  : undefined;
                const parentAuthor = parent ? getAuthorLabel(parent) : "";
                const parentTimestamp = parent ? formatUpdatedAt(parent.createdAt) : "";
                const parentSnippet = parent
                  ? parent.body
                  : "Original comment was deleted.";

                return (
                  <article
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    ref={(node) => {
                      commentRefs.current[comment.id] = node;
                    }}
                    tabIndex={-1}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:border-slate-800 dark:bg-slate-900/60 dark:focus:ring-violet-500/50"
                  >
                    <header className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {comment.parentId ? (
                        <button
                          type="button"
                          onClick={() => handleScrollToParent(comment.parentId ?? null)}
                          disabled={!parent}
                          className="flex flex-col items-start gap-1 rounded-lg bg-slate-100/80 px-2 py-1 text-left font-medium text-slate-500 transition hover:bg-slate-200/80 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/60"
                        >
                          <span className="text-[11px] uppercase tracking-wide">Reply to</span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {parentAuthor || "Original comment was deleted."}
                          </span>
                          {parentTimestamp ? (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {parentTimestamp}
                            </span>
                          ) : null}
                          <span className="line-clamp-2 text-xs font-normal text-slate-600 dark:text-slate-300">
                            {parentSnippet}
                          </span>
                        </button>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-200">
                          {getAuthorLabel(comment)}
                        </span>
                        <time dateTime={comment.createdAt} className="text-xs">
                          {formatUpdatedAt(comment.createdAt)}
                        </time>
                      </div>
                    </header>
                    <div className="max-h-60 overflow-y-auto">
                      <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
                        {comment.body}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-violet-600 dark:text-violet-300">
                      <button
                        type="button"
                        onClick={() => handleReply(comment)}
                        className="font-medium hover:underline"
                      >
                        Reply
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <form ref={formRef} className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div aria-live="polite" className="sr-only">
            {replyAnnouncement}
          </div>
          {newComment.parentId ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-200">
              <div className="flex flex-1 flex-col gap-1">
                <span className="font-semibold uppercase tracking-wide text-[11px]">Replying to</span>
                <span className="text-sm font-medium">
                  {replyTarget ? getAuthorLabel(replyTarget) : "Original comment was deleted."}
                </span>
                {replyTarget ? (
                  <span className="text-[11px] text-violet-600/80 dark:text-violet-200/80">
                    {formatUpdatedAt(replyTarget.createdAt)}
                  </span>
                ) : null}
                <p className="line-clamp-3 whitespace-pre-wrap text-left text-sm text-violet-700/90 dark:text-violet-100/80">
                  {replyTarget ? replyTarget.body : "Original comment was deleted."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewComment((prev) => ({ ...prev, parentId: null }))}
                className="rounded-full p-1 text-sm font-semibold text-violet-600 transition hover:bg-violet-100 dark:text-violet-200 dark:hover:bg-violet-500/20"
                aria-label="Cancel reply"
              >
                ✕
              </button>
            </div>
          ) : null}
          <textarea
            value={newComment.body}
            onChange={(event) =>
              setNewComment((prev) => ({ ...prev, body: event.target.value }))
            }
            onKeyDown={handleComposerKeyDown}
            ref={textareaRef}
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="Leave a comment"
            className="rounded-xl border border-slate-300 bg-white/90 px-4 py-2 text-sm text-slate-900 shadow-inner transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-500/60"
            disabled={submitting}
            aria-label="New comment body"
          />
          <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{`${newComment.body.length}/${MAX_COMMENT_LENGTH}`}</span>
            <button
              type="submit"
              disabled={submitting || !newComment.body.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-500/60"
            >
              {submitting ? "Posting…" : newComment.parentId ? "Reply" : "Comment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
