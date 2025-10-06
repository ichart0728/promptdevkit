"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createPromptComment, getPromptComments } from "@/lib/api";
import { formatUpdatedAt } from "@/lib/format";
import { PromptComment, PromptWithTags } from "@/types/prompt";

const MAX_COMMENT_LENGTH = 2000;

type PromptCommentsDialogProps = {
  prompt: PromptWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    acc.push(node);
    if (node.replies?.length) {
      acc.push(...flattenComments(node.replies));
    }
    return acc;
  }, []);
};

const insertCommentIntoTree = (tree: PromptComment[], comment: PromptComment): PromptComment[] => {
  if (!comment.parentId) {
    return sortByCreatedAt([...tree, comment]);
  }
  const next = tree.map((node) => {
    if (node.id === comment.parentId) {
      return {
        ...node,
        replies: insertCommentIntoTree(node.replies ?? [], comment),
      };
    }
    return {
      ...node,
      replies: insertCommentIntoTree(node.replies ?? [], comment),
    };
  });
  if (!tree.some((node) => node.id === comment.parentId)) {
    return sortByCreatedAt([...tree, comment]);
  }
  return sortByCreatedAt(next);
};

const CommentThread = ({
  comments,
  depth = 0,
  onReply,
}: {
  comments: PromptComment[];
  depth?: number;
  onReply: (comment: PromptComment) => void;
}) => {
  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <div key={comment.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 text-sm shadow-sm transition dark:border-slate-800 dark:bg-slate-900/60" style={{ marginLeft: depth ? depth * 16 : 0 }}>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-600 dark:text-slate-200">
              {comment.authorName ?? comment.authorEmail ?? "Unknown"}
            </span>
            <time dateTime={comment.createdAt}>{formatUpdatedAt(comment.createdAt)}</time>
          </div>
          <p className="whitespace-pre-wrap break-words text-slate-700 dark:text-slate-300">
            {comment.body}
          </p>
          <div className="flex items-center gap-3 text-xs text-violet-600 dark:text-violet-300">
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="font-medium hover:underline"
            >
              Reply
            </button>
          </div>
          {comment.replies && comment.replies.length > 0 ? (
            <CommentThread comments={comment.replies} depth={depth + 1} onReply={onReply} />
          ) : null}
        </div>
      ))}
    </div>
  );
};

export function PromptCommentsDialog({ prompt, open, onOpenChange }: PromptCommentsDialogProps) {
  const [comments, setComments] = useState<PromptComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState<NewCommentState>(defaultNewComment);

  useEffect(() => {
    if (!open) {
      setComments([]);
      setError(null);
      setNewComment(defaultNewComment);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getPromptComments(prompt.id)
      .then((data) => {
        if (!isMounted) return;
        setComments(data);
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
  }, [open, prompt.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newComment.body.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const created = await createPromptComment(prompt.id, {
        body: trimmed,
        parentId: newComment.parentId ?? undefined,
      });
      setComments((current) => insertCommentIntoTree(current, created));
      setNewComment(defaultNewComment);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const replyLabel = useMemo(() => {
    if (!newComment.parentId) return null;
    const target = flattenComments(comments).find(
      (comment) => comment.id === newComment.parentId
    );
    return target?.authorName ?? target?.authorEmail ?? "";
  }, [comments, newComment.parentId]);

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
              Discuss this prompt with your teammates.
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
            <CommentThread comments={comments} onReply={(comment) => setNewComment({ body: "", parentId: comment.id })} />
          )}
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {replyLabel ? (
            <div className="flex items-center justify-between rounded-full bg-violet-100/60 px-3 py-1 text-xs text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
              <span>Replying to {replyLabel}</span>
              <button
                type="button"
                onClick={() => setNewComment(defaultNewComment)}
                className="font-semibold hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : null}
          <textarea
            value={newComment.body}
            onChange={(event) => setNewComment((prev) => ({ ...prev, body: event.target.value }))}
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
