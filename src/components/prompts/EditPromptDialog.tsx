"use client";

import { useMemo } from "react";

import { updatePrompt } from "@/lib/api";
import { normalizeTag } from "@/lib/tag";
import { PromptWithTags } from "@/types/prompt";

import { PromptFormDialog, type PromptFormValues } from "./PromptFormDialog";

type EditPromptDialogProps = {
  prompt: PromptWithTags;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (prompt: PromptWithTags) => void | Promise<void>;
};

export function EditPromptDialog({ prompt, open, onOpenChange, onUpdated }: EditPromptDialogProps) {
  const initialValues = useMemo(() => {
    return {
      title: prompt.title,
      body: prompt.body,
      tags: prompt.tags.map(({ tag }) => normalizeTag(tag.name)).filter(Boolean),
      notes: prompt.notes ?? "",
    } satisfies PromptFormValues;
  }, [prompt]);

  const handleSubmit = async ({ title, body, tags, notes }: PromptFormValues) => {
    const updated = await updatePrompt(prompt.id, {
      title,
      body,
      tags: tags.length ? tags : undefined,
      notes,
    });
    await onUpdated(updated);
  };

  return (
    <PromptFormDialog
      mode="edit"
      open={open}
      onOpenChange={onOpenChange}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      heading="Edit prompt"
      description="Update the prompt details and save your changes."
      submitLabel="Update prompt"
    />
  );
}
