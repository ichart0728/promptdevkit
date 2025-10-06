import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  formatValidationError,
  logValidationFailure,
  normalizeTags,
  promptCreationSchema,
} from "@/lib/prompt-validation";
import { getSessionOrDev } from "@/lib/session";
import { Prisma } from "@prisma/client";

type Params = {
  params: { id: string };
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

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

export async function PATCH(req: Request, { params }: Params) {
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

  const prompt = await prisma.prompt.findFirst({
    where: buildAccessFilter(params.id, session.user.id),
    include: {
      tags: { include: { tag: true } },
      team: true,
      owner: true,
    },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[prompts:update] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: { fieldErrors: {}, formErrors: ["Invalid JSON body."] } },
      { status: 400 }
    );
  }

  const parsed = promptCreationSchema.safeParse(payload);
  if (!parsed.success) {
    logValidationFailure("prompts:update", parsed.error);
    return NextResponse.json(formatValidationError(parsed.error), {
      status: 400,
    });
  }

  const data = parsed.data;
  const normalizedTags = normalizeTags(data.tags);
  const currentTags = prompt.tags.map(({ tag }) => tag.name);
  const notes = typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

  const hasChanges =
    prompt.title !== data.title ||
    prompt.body !== data.body ||
    (prompt.notes ?? null) !== notes ||
    !arraysEqual(currentTags, normalizedTags);

  if (!hasChanges) {
    return NextResponse.json(prompt);
  }

  const result = await prisma.$transaction(async (tx) => {
    const latestVersion = await tx.promptVersion.findFirst({
      where: { promptId: prompt.id },
      orderBy: { version: "desc" },
    });

    await tx.promptVersion.create({
      data: {
        promptId: prompt.id,
        version: (latestVersion?.version ?? 0) + 1,
        title: prompt.title,
        body: prompt.body,
        variables: prompt.variables,
      },
    });

    const tagIdByName = new Map(prompt.tags.map((entry) => [entry.tag.name, entry.tagId]));
    const tagsToRemove = currentTags.filter((name) => !normalizedTags.includes(name));
    const tagIdsToRemove = tagsToRemove
      .map((name) => tagIdByName.get(name))
      .filter((value): value is string => Boolean(value));
    const tagsToAdd = normalizedTags.filter((name) => !tagIdByName.has(name));

    const updated = await tx.prompt.update({
      where: { id: prompt.id },
      data: {
        title: data.title,
        body: data.body,
        variables: data.variables ?? prompt.variables,
        logging: typeof data.logging === "boolean" ? data.logging : prompt.logging,
        notes,
        tags: {
          deleteMany: tagIdsToRemove.length ? { tagId: { in: tagIdsToRemove } } : undefined,
          create: tagsToAdd.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        },
      },
      include: {
        tags: { include: { tag: true } },
        team: true,
        owner: true,
      },
    });

    return updated;
  });

  return NextResponse.json(result);
}

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

  const prompt = await prisma.prompt.findFirst({
    where: buildAccessFilter(params.id, session.user.id),
  });

  if (!prompt) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  await prisma.prompt.update({
    where: { id: prompt.id },
    data: { archivedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
