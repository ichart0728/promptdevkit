"use client";

import { createPrompt } from "@/lib/api";
import { PromptWithTags } from "@/types/prompt";
import { WorkspaceContext, isTeamWorkspace } from "@/types/workspace";

import {
  PromptFormDialog,
  type PromptFormSubmitValues,
} from "./PromptFormDialog";

type CreatePromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (prompt: PromptWithTags) => void | Promise<void>;
  workspace: WorkspaceContext;
};

export function CreatePromptDialog({
  open,
  onOpenChange,
  onCreated,
  workspace,
}: CreatePromptDialogProps) {
  const handleSubmit = async ({ title, body, tags, notes }: PromptFormSubmitValues) => {
    if (isTeamWorkspace(workspace) && !workspace.teamId) {
      throw new Error("チーム用のプロンプトを作成するには、チームを選択してください。");
    }
    const prompt = await createPrompt({
      title,
      body,
      tags: tags.length ? tags : undefined,
      notes,
      teamId: isTeamWorkspace(workspace) ? workspace.teamId ?? undefined : undefined,
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
