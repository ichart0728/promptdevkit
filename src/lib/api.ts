import { PromptComment, PromptVersion, PromptWithTags } from "@/types/prompt";
import { TeamSummary } from "@/types/team";
import { WorkspaceContext, isTeamWorkspace } from "@/types/workspace";

type FetchError = Error & { status?: number };

const buildError = async (res: Response): Promise<FetchError> => {
  let message = `${res.status} ${res.statusText}`;
  try {
    const data = await res.json();
    if (typeof data === "string") {
      message = data;
    } else if (data?.error) {
      if (typeof data.error === "string") {
        message = data.error;
      } else if (Array.isArray(data.error.formErrors) && data.error.formErrors.length > 0) {
        message = data.error.formErrors.join("\n");
      }
    }
  } catch {
    // ignore parsing errors
  }
  const err = new Error(message) as FetchError;
  err.status = res.status;
  return err;
};

const applyWorkspaceParams = (
  params: URLSearchParams,
  workspace: WorkspaceContext
) => {
  params.set("workspace", workspace.type);
  if (isTeamWorkspace(workspace) && workspace.teamId) {
    params.set("teamId", workspace.teamId);
  }
};

type GetPromptsParams = {
  workspace: WorkspaceContext;
  q?: string;
  tags?: string[];
};

export async function getPrompts({
  workspace,
  q,
  tags = [],
}: GetPromptsParams): Promise<PromptWithTags[]> {
  const params = new URLSearchParams();
  applyWorkspaceParams(params, workspace);
  if (q) params.set("q", q);
  if (tags.length) {
    tags.forEach((tag) => {
      if (tag) params.append("tag", tag);
    });
  }
  const search = params.toString();
  const url = `/api/prompts${search ? `?${search}` : ""}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

type CreatePromptPayload = {
  title: string;
  body: string;
  tags?: string[];
  notes?: string;
  teamId?: string;
};

export async function createPrompt(payload: CreatePromptPayload): Promise<PromptWithTags> {
  const res = await fetch("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

type UpdatePromptPayload = {
  title: string;
  body: string;
  tags?: string[];
  notes?: string;
  removedTags?: string[];
};

export async function updatePrompt(id: string, payload: UpdatePromptPayload): Promise<PromptWithTags> {
  const res = await fetch(`/api/prompts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function deletePrompt(id: string): Promise<void> {
  const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw await buildError(res);
  }
}

export async function getPromptVersions(
  promptId: string,
  workspace: WorkspaceContext
): Promise<PromptVersion[]> {
  const params = new URLSearchParams();
  applyWorkspaceParams(params, workspace);
  const search = params.toString();
  const res = await fetch(
    `/api/prompts/${promptId}/versions${search ? `?${search}` : ""}`,
    { method: "GET" }
  );
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function deletePromptVersion(
  promptId: string,
  versionId: string,
  workspace: WorkspaceContext
): Promise<void> {
  const params = new URLSearchParams();
  applyWorkspaceParams(params, workspace);
  const search = params.toString();
  const res = await fetch(
    `/api/prompts/${promptId}/versions/${versionId}${search ? `?${search}` : ""}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok) {
    throw await buildError(res);
  }
}

type CreatePromptCommentPayload = {
  body: string;
  parentId?: string | null;
};

export async function getPromptComments(
  promptId: string,
  workspace: WorkspaceContext
): Promise<PromptComment[]> {
  const params = new URLSearchParams();
  applyWorkspaceParams(params, workspace);
  const search = params.toString();
  const res = await fetch(
    `/api/prompts/${promptId}/comments${search ? `?${search}` : ""}`,
    { method: "GET" }
  );
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function createPromptComment(
  promptId: string,
  workspace: WorkspaceContext,
  payload: CreatePromptCommentPayload
): Promise<PromptComment> {
  const params = new URLSearchParams();
  applyWorkspaceParams(params, workspace);
  const search = params.toString();
  const res = await fetch(`/api/prompts/${promptId}/comments${search ? `?${search}` : ""}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function getTeams(): Promise<TeamSummary[]> {
  const res = await fetch(`/api/teams`, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}
