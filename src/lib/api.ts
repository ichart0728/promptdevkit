import { PromptWithTags } from "@/types/prompt";

const buildError = async (res: Response) => {
  let message = `${res.status} ${res.statusText}`;
  try {
    const data = await res.json();
    if (typeof data === "string") {
      message = data;
    } else if (data?.error) {
      if (typeof data.error === "string") {
        message = data.error;
      } else if (data.error.formErrors?.length) {
        message = data.error.formErrors.join("\n");
      }
    }
  } catch (error) {
    // ignore json parsing errors
  }
  return new Error(message);
};

export async function getPrompts(q?: string, tag?: string): Promise<PromptWithTags[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
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
  variables?: Record<string, string>;
  tags?: string[];
  logging?: boolean;
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

export async function runPrompt(
  id: string,
  variables: Record<string, string>
): Promise<{ result: string }> {
  const res = await fetch(`/api/prompts/${id}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variables }),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}
