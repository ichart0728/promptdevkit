import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { Prisma } from "@prisma/client";

type Params = {
  params: { id: string; versionId: string };
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

  const version = await prisma.promptVersion.findFirst({
    where: {
      id: params.versionId,
      promptId: params.id,
      prompt: { is: buildAccessFilter(params.id, session.user.id) },
    },
  });

  if (!version) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  await prisma.promptVersion.delete({
    where: { id: version.id },
  });

  return NextResponse.json({ success: true });
}
