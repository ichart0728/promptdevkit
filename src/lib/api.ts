import { PromptComment, PromptVersion, PromptWithTags } from "@/types/prompt";

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

export async function getPrompts(
  q?: string,
  tags: string[] = []
): Promise<PromptWithTags[]> {
  const params = new URLSearchParams();
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

export async function getPromptVersions(promptId: string): Promise<PromptVersion[]> {
  const res = await fetch(`/api/prompts/${promptId}/versions`, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function deletePromptVersion(promptId: string, versionId: string): Promise<void> {
  const res = await fetch(`/api/prompts/${promptId}/versions/${versionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw await buildError(res);
  }
}

type CreatePromptCommentPayload = {
  body: string;
  parentId?: string | null;
};

export async function getPromptComments(promptId: string): Promise<PromptComment[]> {
  const res = await fetch(`/api/prompts/${promptId}/comments`, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function createPromptComment(
  promptId: string,
  payload: CreatePromptCommentPayload
): Promise<PromptComment> {
  const res = await fetch(`/api/prompts/${promptId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}
