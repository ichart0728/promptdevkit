export type WorkspaceType = "personal" | "team";

export type WorkspaceContext =
  | { type: "personal" }
  | { type: "team"; teamId?: string | null };

export const isTeamWorkspace = (
  workspace: WorkspaceContext
): workspace is { type: "team"; teamId?: string | null } => workspace.type === "team";
