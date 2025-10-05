"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { createPrompt } from "@/lib/api";
import { normalizeTag, normalizeTags } from "@/lib/tag";
import { PromptWithTags } from "@/types/prompt";

type CreatePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (prompt: PromptWithTags) => void | Promise<void>;
};

type Errors = {
  title?: string;
  body?: string;
  tags?: string;
  form?: string;
};

const focusableSelector =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function CreatePromptDialog({ open, onOpenChange, onCreated }: CreatePromptDialogProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastActiveElement.current = document.activeElement as HTMLElement | null;

    const focusNode = () => {
      const target = titleRef.current;
      if (target) {
        window.setTimeout(() => target.focus());
      }
    };

    focusNode();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
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

    const handleFocus = (event: FocusEvent) => {
      if (!open) return;
      const container = containerRef.current;
      if (!container) return;
      if (container.contains(event.target as Node)) return;
      const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
      firstFocusable?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focus", handleFocus, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focus", handleFocus, true);
      lastActiveElement.current?.focus();
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setBody("");
      setTags([]);
      setTagInput("");
      setErrors({});
      setSubmitting(false);
    }
  }, [open]);

  const addTagsFromInput = () => {
    const parts = tagInput.split(/[\s,]+/).map(normalizeTag).filter(Boolean);
    if (parts.length === 0) {
      setTagInput("");
      return;
    }

    let nextTags = [...tags];
    let message: string | undefined;

    for (const tag of parts) {
      if (tag.length > 32) {
        message = "Tags must be 32 characters or fewer.";
        continue;
      }
      if (nextTags.includes(tag)) continue;
      if (nextTags.length >= 10) {
        message = "Up to 10 tags are allowed.";
        break;
      }
      nextTags.push(tag);
    }

    setTags(nextTags);
    setTagInput("");
    setErrors((prev) => ({ ...prev, tags: message }));
  };

  const removeTag = (tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  };

  const validate = (): Errors => {
    const nextErrors: Errors = {};
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      nextErrors.title = "Title is required.";
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = "Title must be 120 characters or fewer.";
    }

    if (!trimmedBody) {
      nextErrors.body = "Body is required.";
    } else if (trimmedBody.length > 8000) {
      nextErrors.body = "Body must be 8000 characters or fewer.";
    }

    if (tags.length > 10) {
      nextErrors.tags = "Up to 10 tags are allowed.";
    }

    if (tags.some((tag) => tag.length > 32)) {
      nextErrors.tags = "Tags must be 32 characters or fewer.";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    setErrors({});

    try {
      const prompt = await createPrompt({
        title: title.trim(),
        body: body.trim(),
        tags: tags.length ? normalizeTags(tags) : undefined,
      });
      await onCreated(prompt);
      onOpenChange(false);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Failed to create prompt.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tagHint = useMemo(() => {
    return `${tags.length}/10 tags`;
  }, [tags.length]);

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
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-prompt-heading"
        className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/30 transition dark:border-slate-700 dark:bg-slate-900"
      >
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="create-prompt-heading" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Add prompt
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Provide prompt details to add it to your library.</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-violet-500/60"
              aria-label="Close create prompt dialog"
            >
              ✕
            </button>
          </header>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</span>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                required
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-inner transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-500/60"
                aria-invalid={errors.title ? "true" : undefined}
              />
              {errors.title ? (
                <span className="text-xs text-red-500" role="alert">
                  {errors.title}
                </span>
              ) : null}
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Body</span>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={6}
                maxLength={8000}
                required
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-inner transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-500/60"
                aria-invalid={errors.body ? "true" : undefined}
              />
              {errors.body ? (
                <span className="text-xs text-red-500" role="alert">
                  {errors.body}
                </span>
              ) : null}
            </label>

            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tags <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({tagHint})</span>
                </span>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white/60 px-3 py-2 shadow-inner transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:focus-within:border-violet-500 dark:focus-within:ring-violet-500/60">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded-full p-1 text-violet-600 transition hover:bg-violet-200/70 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-violet-200 dark:hover:bg-violet-500/30 dark:focus:ring-violet-500/60"
                        aria-label={`Remove tag ${tag}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onBlur={addTagsFromInput}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTagsFromInput();
                      } else if (event.key === "Backspace" && !tagInput && tags.length > 0) {
                        event.preventDefault();
                        removeTag(tags[tags.length - 1]);
                      }
                    }}
                    placeholder={tags.length ? "Add another tag" : "Add tags"}
                    className="min-w-[120px] flex-1 border-none bg-transparent px-1 py-1 text-sm text-slate-900 focus:outline-none dark:text-slate-100"
                    aria-label="Add tags"
                  />
                </div>
              </label>
              {errors.tags ? (
                <span className="text-xs text-red-500" role="alert">
                  {errors.tags}
                </span>
              ) : (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Press Enter or comma to create a tag. Tags are normalized to lowercase.
                </span>
              )}
            </div>
          </div>

          {errors.form ? (
            <p className="text-sm text-red-500" role="alert">
              {errors.form}
            </p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-transparent px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white/60 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900/60 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-500/60"
            >
              {submitting ? "Saving…" : "Save prompt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
