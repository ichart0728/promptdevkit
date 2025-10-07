import { prisma } from "@/lib/prisma";
import {
  formatValidationError,
  logValidationFailure,
  normalizeTagName,
  normalizeTags,
  promptCreationSchema,
} from "@/lib/prompt-validation";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionOrDev } from "@/lib/session";

export async function GET(req: Request) {
  // NOTE: 開発時のみコメントアウト。本番ではこっちを使う。
  // const session = await auth();
  // if (!session?.user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // NOTE: 開発時のみ。
  const session = await getSessionOrDev();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const normalizedTag = tag ? normalizeTagName(tag) : undefined;

  const filters: Prisma.PromptWhereInput[] = [
    { archivedAt: null },
    {
      OR: [
        {
          ownerId: session.user.id,
          owner: { deletedAt: null },
        },
        {
          team: {
            deletedAt: null,
            members: {
              some: { userId: session.user.id },
            },
          },
        },
      ],
    },
  ];

  if (q) {
    filters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (normalizedTag) {
    filters.push({
      tags: {
        some: {
          tag: {
            name: normalizedTag,
          },
        },
      },
    });
  }

  const prompts = await prisma.prompt.findMany({
    where: { AND: filters },
    orderBy: { updatedAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      team: true,
      owner: true,
    },
  });

  return NextResponse.json(prompts);
}

export async function POST(req: Request) {
  // NOTE: 開発時のみコメントアウト。本番ではこっちを使う。
  // const session = await auth();
  // if (!session?.user) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  // NOTE: 開発時のみ。
  const session = await getSessionOrDev();
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[prompts:create] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: { fieldErrors: {}, formErrors: ["Invalid JSON body."] } },
      { status: 400 }
    );
  }

  const parsed = promptCreationSchema.safeParse(payload);
  if (!parsed.success) {
    logValidationFailure("prompts:create", parsed.error);
    return NextResponse.json(formatValidationError(parsed.error), {
      status: 400,
    });
  }

  const data = parsed.data;
  const variables = data.variables ?? {};
  const normalizedTags = normalizeTags(data.tags);
  const logging = data.logging ?? false;
  const teamId = typeof data.teamId === "string" ? data.teamId : undefined;
  const notes = typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

  const isTeamPrompt = Boolean(teamId);

  if (isTeamPrompt) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: teamId!,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const prompt = await prisma.prompt.create({
    data: {
      title: data.title,
      body: data.body,
      variables,
      logging,
      notes,
      ownerId: isTeamPrompt ? null : session.user.id,
      teamId: isTeamPrompt ? teamId! : null,
      createdById: session.user.id,
      tags: normalizedTags.length
        ? {
            create: normalizedTags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          }
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
      team: true,
      owner: true,
    },
  });

  return NextResponse.json(prompt, { status: 201 });
}
