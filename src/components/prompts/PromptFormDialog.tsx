"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { normalizeTag, normalizeTags as normalizeTagList } from "@/lib/tag";

export type PromptFormValues = {
  title: string;
  body: string;
  tags: string[];
  notes?: string;
};

type PromptFormDialogProps = {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PromptFormValues) => Promise<void>;
  initialValues?: PromptFormValues;
  heading?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
};

type Errors = {
  title?: string;
  body?: string;
  tags?: string;
  notes?: string;
  form?: string;
};

const focusableSelector =
  "a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => !element.hasAttribute("data-focus-guard")
  );

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

const defaultValues: PromptFormValues = {
  title: "",
  body: "",
  tags: [],
  notes: "",
};

export function PromptFormDialog({
  mode,
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  heading,
  description,
  submitLabel,
  cancelLabel = "Cancel",
}: PromptFormDialogProps) {
  const values = initialValues ?? defaultValues;
  const initialSnapshot = useMemo(
    () => ({
      title: values.title,
      body: values.body,
      tags: [...values.tags],
      notes: values.notes ?? "",
    }),
    [values.title, values.body, values.tags, values.notes]
  );

  const [title, setTitle] = useState(values.title);
  const [body, setBody] = useState(values.body);
  const [tags, setTags] = useState<string[]>(values.tags);
  const [notes, setNotes] = useState(values.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle(initialSnapshot.title);
      setBody(initialSnapshot.body);
      setTags([...initialSnapshot.tags]);
      setNotes(initialSnapshot.notes ?? "");
      setTagInput("");
      setErrors({});
      setSubmitting(false);
      return;
    }

    lastActiveElement.current = document.activeElement as HTMLElement | null;
    setTitle(initialSnapshot.title);
    setBody(initialSnapshot.body);
    setTags([...initialSnapshot.tags]);
    setNotes(initialSnapshot.notes ?? "");
    setTagInput("");

    const focusInitialField = () => {
      const target = titleRef.current;
      if (target) {
        window.setTimeout(() => target.focus());
      }
    };

    focusInitialField();

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
        const focusables = getFocusableElements(container);
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
  }, [open, onOpenChange, initialSnapshot]);

  const addTagsFromInput = () => {
    const parts = tagInput
      .split(/[\s,]+/)
      .map(normalizeTag)
      .filter(Boolean);
    if (parts.length === 0) {
      setTagInput("");
      return;
    }

    const nextTags = [...tags];
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

  const removeTagAt = (index: number) => {
    setTags((current) => {
      if (index < 0 || index >= current.length) return current;
      const next = current.slice();
      next.splice(index, 1);
      return next;
    });
  };

  const validate = (): Errors => {
    const nextErrors: Errors = {};
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const trimmedNotes = notes.trim();

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

    if (trimmedNotes.length > 4000) {
      nextErrors.notes = "Notes must be 4000 characters or fewer.";
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) return;

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const trimmedNotes = notes.trim();
    const normalizedTags = tags.length ? normalizeTagList(tags) : [];

    setSubmitting(true);
    setErrors({});

    try {
      await onSubmit({
        title: trimmedTitle,
        body: trimmedBody,
        tags: normalizedTags,
        notes: trimmedNotes ? trimmedNotes : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error ? error.message : "Failed to submit prompt.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tagHint = useMemo(() => `${tags.length}/10 tags`, [tags.length]);

  if (!open) return null;

  const dialogHeading =
    heading ?? (mode === "create" ? "Add prompt" : "Edit prompt");
  const dialogDescription =
    description ??
    (mode === "create"
      ? "Provide prompt details to add it to your library."
      : "Update the prompt details and save your changes.");
  const primaryLabel =
    submitLabel ?? (mode === "create" ? "Save prompt" : "Update prompt");

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
        aria-labelledby="prompt-form-heading"
        className="w-full max-w-xl rounded-2xl border border-violet-200 bg-white p-6 shadow-2xl shadow-violet-500/20 transition dark:border-violet-500/40 dark:bg-slate-900"
      >
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <header className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2
                id="prompt-form-heading"
                className="text-xl font-semibold text-slate-900 dark:text-slate-100"
              >
                {dialogHeading}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {dialogDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-transparent p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200 dark:focus:ring-violet-500/60"
              aria-label="Close prompt dialog"
            >
              ✕
            </button>
          </header>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Title
              </span>
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Body
              </span>
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

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Notes
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                maxLength={4000}
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-900 shadow-inner transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-violet-500 dark:focus:ring-violet-500/60"
                aria-invalid={errors.notes ? "true" : undefined}
                placeholder="Add internal notes or context (optional)"
              />
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    errors.notes
                      ? "text-red-500"
                      : "text-slate-400 dark:text-slate-500"
                  }
                >
                  {errors.notes ?? "Visible to collaborators only."}
                </span>
                <span className="text-slate-400 dark:text-slate-500">{`${notes.length}/4000`}</span>
              </div>
            </label>

            <div className="flex flex-col gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Tags{" "}
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                    ({tagHint})
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white/60 px-3 py-2 shadow-inner transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/60 dark:border-slate-700 dark:bg-slate-900/60 dark:focus-within:border-violet-500 dark:focus-within:ring-violet-500/60">
                  {tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 dark:bg-violet-500/10 dark:text-violet-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTagAt(index)}
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
                      } else if (
                        event.key === "Backspace" &&
                        !tagInput &&
                        tags.length > 0
                      ) {
                        event.preventDefault();
                        removeTagAt(tags.length - 1);
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
                  Press Enter or comma to create a tag. Tags are normalized to
                  lowercase.
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
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus:ring-violet-500/60"
            >
              {submitting ? "Saving…" : primaryLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
