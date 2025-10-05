"use client";

import { FormEvent, useState } from "react";
import { createPrompt } from "@/lib/api";
import { normalizeTag, normalizeTags } from "@/lib/tag";
import { Field } from "@/components/ui/Field";
import { PromptWithTags } from "@/types/prompt";

type PromptFormProps = {
  onCreated: (prompt: PromptWithTags) => Promise<void> | void;
};

type Errors = {
  title?: string;
  body?: string;
  tags?: string;
  form?: string;
};

export function PromptForm({ onCreated }: PromptFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parseTags = (input: string) =>
    input
      .split(/[\s,]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

  const validate = () => {
    const nextErrors: Errors = {};
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (trimmedTitle.length === 0) {
      nextErrors.title = "Title is required.";
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = "Title must be 120 characters or fewer.";
    }

    if (trimmedBody.length === 0) {
      nextErrors.body = "Body is required.";
    } else if (trimmedBody.length > 8000) {
      nextErrors.body = "Body must be 8000 characters or fewer.";
    }

    const rawTags = parseTags(tagsInput);
    const normalizedRaw = rawTags.map(normalizeTag).filter(Boolean);
    const uniqueNormalized = Array.from(new Set(normalizedRaw));

    if (uniqueNormalized.length > 10) {
      nextErrors.tags = "Up to 10 tags are allowed.";
    }

    if (uniqueNormalized.some((tag) => tag.length > 32)) {
      nextErrors.tags = "Tags must be 32 characters or fewer.";
    }

    setErrors(nextErrors);

    return {
      valid: Object.keys(nextErrors).length === 0,
      tags: uniqueNormalized.length ? normalizeTags(rawTags) : [],
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    const { valid, tags } = validate();
    if (!valid) return;

    setSubmitting(true);
    setErrors({});

    try {
      const prompt = await createPrompt({
        title: title.trim(),
        body: body.trim(),
        tags: tags.length ? tags : undefined,
      });
      await onCreated(prompt);
      setTitle("");
      setBody("");
      setTagsInput("");
      setSuccessMessage("Prompt created successfully.");
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Failed to create prompt." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md border border-gray-200 bg-white p-4"
    >
      <h2 className="text-lg font-semibold text-gray-900">Create Prompt</h2>
      <Field label="Title" htmlFor="prompt-title" error={errors.title ?? null}>
        <input
          id="prompt-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Field>
      <Field label="Body" htmlFor="prompt-body" error={errors.body ?? null}>
        <textarea
          id="prompt-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={8000}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Field>
      <Field
        label="Tags"
        htmlFor="prompt-tags"
        description="Separate tags with spaces or commas."
        error={errors.tags ?? null}
      >
        <input
          id="prompt-tags"
          type="text"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value.toLowerCase())}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Field>
      {errors.form ? <p className="text-sm text-red-600">{errors.form}</p> : null}
      {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
