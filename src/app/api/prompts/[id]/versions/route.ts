import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { Prisma } from "@prisma/client";

type Params = {
  params: { id: string };
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

export async function GET(req: Request, { params }: Params) {
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

  const prompt = await prisma.prompt.findFirst({
    where: buildAccessFilter(params.id, session.user.id),
    select: { id: true, ownerId: true, teamId: true },
  });

  if (!prompt || !promptMatchesWorkspace(prompt, session.user.id, workspace)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const versions = await prisma.promptVersion.findMany({
    where: { promptId: prompt.id },
    orderBy: { version: "desc" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(versions);
}
