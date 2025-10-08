import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { Prisma } from "@prisma/client";

type Params = {
  params: { id: string; versionId: string };
};

type WorkspaceParams = {
  workspace: "personal" | "team";
  teamId?: string;
};

const parseWorkspace = (req: Request): WorkspaceParams => {
  const { searchParams } = new URL(req.url);
  const workspaceParam = searchParams.get("workspace");
  const workspace = workspaceParam === "team" ? "team" : "personal";
  const teamId = searchParams.get("teamId") ?? undefined;
  return { workspace, teamId };
};

const promptMatchesWorkspace = (
  prompt: { ownerId: string | null; teamId: string | null },
  userId: string,
  { workspace, teamId }: WorkspaceParams
) => {
  if (workspace === "personal") {
    return prompt.ownerId === userId;
  }

  if (!prompt.teamId) {
    return false;
  }

  if (teamId && prompt.teamId !== teamId) {
    return false;
  }

  return true;
};

const buildAccessFilter = (promptId: string, userId: string): Prisma.PromptWhereInput => ({
  id: promptId,
  archivedAt: null,
  OR: [
    {
      ownerId: userId,
      owner: { deletedAt: null },
    },
    {
      team: {
        deletedAt: null,
        members: {
          some: { userId },
        },
      },
    },
  ],
});

export async function DELETE(req: Request, { params }: Params) {
  // NOTE: 開発時のみコメントアウト。本番ではこっちを使う。
  // const session = await auth();
  // if (!session?.user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // NOTE: 開発時のみ。
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = parseWorkspace(req);

  const version = await prisma.promptVersion.findFirst({
    where: {
      id: params.versionId,
      promptId: params.id,
      prompt: {
        is: buildAccessFilter(params.id, session.user.id),
        ownerId: workspace.workspace === "personal" ? session.user.id : undefined,
        teamId:
          workspace.workspace === "team"
            ? workspace.teamId
              ? workspace.teamId
              : { not: null }
            : undefined,
      },
    },
    include: {
      prompt: { select: { ownerId: true, teamId: true } },
    },
  });

  if (!version || !promptMatchesWorkspace(version.prompt, session.user.id, workspace)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  await prisma.promptVersion.delete({
    where: { id: version.id },
  });

  return NextResponse.json({ success: true });
}
