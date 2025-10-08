import { PromptComment, PromptVersion, PromptWithTags } from "@/types/prompt";
import {
  TeamDetail,
  TeamInviteSummary,
  TeamMemberWithUser,
  TeamRole,
  TeamSummary,
} from "@/types/team";

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

type GetPromptsParams = {
  q?: string;
  tags?: string[];
  teamId?: string | null;
};

export async function getPrompts({
  q,
  tags = [],
  teamId,
}: GetPromptsParams = {}): Promise<PromptWithTags[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tags.length) {
    tags.forEach((tag) => {
      if (tag) params.append("tag", tag);
    });
  }
  if (teamId) {
    params.set("teamId", teamId);
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
  teamId?: string | null;
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

type GetPromptVersionsParams = {
  promptId: string;
  teamId?: string | null;
};

export async function getPromptVersions({
  promptId,
  teamId,
}: GetPromptVersionsParams): Promise<PromptVersion[]> {
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
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

type DeletePromptVersionParams = {
  promptId: string;
  versionId: string;
  teamId?: string | null;
};

export async function deletePromptVersion({
  promptId,
  versionId,
  teamId,
}: DeletePromptVersionParams): Promise<void> {
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
  const search = params.toString();
  const res = await fetch(
    `/api/prompts/${promptId}/versions/${versionId}${search ? `?${search}` : ""}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw await buildError(res);
  }
}

type CreatePromptCommentPayload = {
  body: string;
  parentId?: string | null;
  teamId?: string | null;
};

export async function getPromptComments(
  promptId: string,
  teamId?: string | null
): Promise<PromptComment[]> {
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
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
  payload: CreatePromptCommentPayload
): Promise<PromptComment> {
  const { teamId, ...rest } = payload;
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
  const search = params.toString();
  const res = await fetch(
    `/api/prompts/${promptId}/comments${search ? `?${search}` : ""}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    }
  );
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

// Team API helpers ---------------------------------------------------------

type CreateTeamPayload = {
  name: string;
  description?: string;
};

export async function getTeams(): Promise<TeamSummary[]> {
  const res = await fetch(`/api/teams`, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function createTeam(payload: CreateTeamPayload): Promise<TeamSummary> {
  const res = await fetch(`/api/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

type InviteTeamMemberPayload = {
  email: string;
  role?: TeamRole;
};

export async function inviteTeamMember(
  teamId: string,
  payload: InviteTeamMemberPayload
): Promise<TeamInviteSummary> {
  const res = await fetch(`/api/teams/${teamId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function getTeam(teamId: string): Promise<TeamDetail> {
  const res = await fetch(`/api/teams/${teamId}`, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

type UpdateTeamPayload = {
  name?: string;
  description?: string | null;
};

export async function updateTeam(
  teamId: string,
  payload: UpdateTeamPayload
): Promise<TeamDetail> {
  const res = await fetch(`/api/teams/${teamId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function deleteTeam(teamId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw await buildError(res);
  }
}

export async function updateTeamMemberRole(
  teamId: string,
  memberId: string,
  role: TeamRole
): Promise<TeamMemberWithUser> {
  const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function removeTeamMember(
  teamId: string,
  memberId: string
): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw await buildError(res);
  }
}

export async function leaveTeam(teamId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/leave`, { method: "POST" });
  if (!res.ok) {
    throw await buildError(res);
  }
}

export async function generateTeamInviteLink(teamId: string): Promise<{ token: string }> {
  const res = await fetch(`/api/teams/${teamId}/invite-link`, { method: "POST" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

type TransferTeamOwnershipPayload = {
  newOwnerId: string;
};

export async function transferTeamOwnership(
  teamId: string,
  payload: TransferTeamOwnershipPayload
): Promise<TeamDetail> {
  const res = await fetch(`/api/teams/${teamId}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function getTeamInvites(teamId: string): Promise<TeamInviteSummary[]> {
  const res = await fetch(`/api/teams/${teamId}/invites`, { method: "GET" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}

export async function revokeTeamInvite(
  teamId: string,
  inviteId: string
): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/invites/${inviteId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw await buildError(res);
  }
}

export async function acceptTeamInvite(token: string): Promise<TeamDetail> {
  const res = await fetch(`/api/teams/invites/${token}`, { method: "POST" });
  if (!res.ok) {
    throw await buildError(res);
  }
  return res.json();
}
