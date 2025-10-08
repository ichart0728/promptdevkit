"use client";

import { createPrompt } from "@/lib/api";
import { PromptWithTags } from "@/types/prompt";

import {
  PromptFormDialog,
  type PromptFormSubmitValues,
} from "./PromptFormDialog";

type CreatePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (prompt: PromptWithTags) => void | Promise<void>;
};

export function CreatePromptDialog({
  open,
  onOpenChange,
  onCreated,
}: CreatePromptDialogProps) {
  const handleSubmit = async ({ title, body, tags, notes }: PromptFormSubmitValues) => {
    const prompt = await createPrompt({
      title,
      body,
      tags: tags.length ? tags : undefined,
      notes,
    });
    await onCreated(prompt);
  };

  return (
    <PromptFormDialog
      mode="create"
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
    />
  );
}
