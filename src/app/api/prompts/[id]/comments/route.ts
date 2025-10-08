import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";

const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required.").max(2000, "Comments must be 2000 characters or fewer."),
  parentId: z.string().cuid().optional().nullable(),
});

type WorkspaceParams = {
  workspace: "personal" | "team";
  teamId?: string;
};

type SerializedComment = {
  id: string;
  promptId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  replies: SerializedComment[];
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

const buildAccessFilter = (promptId: string, userId: string) => ({
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

const serializeComments = (
  comments: Array<
    {
      id: string;
      promptId: string;
      parentId: string | null;
      body: string;
      createdAt: Date;
      updatedAt: Date;
      author?: { id: string; name: string | null; email: string | null } | null;
    }
  >
): SerializedComment[] => {
  const map = new Map<string, SerializedComment>();
  const roots: SerializedComment[] = [];

  comments.forEach((comment) => {
    const node: SerializedComment = {
      id: comment.id,
      promptId: comment.promptId,
      parentId: comment.parentId,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      authorId: comment.author?.id ?? null,
      authorName: comment.author?.name ?? null,
      authorEmail: comment.author?.email ?? null,
      replies: [],
    };
    map.set(comment.id, node);
  });

  comments.forEach((comment) => {
    const node = map.get(comment.id);
    if (!node) return;
    if (comment.parentId) {
      const parentNode = map.get(comment.parentId);
      if (parentNode) {
        parentNode.replies.push(node);
        return;
      }
    }
    roots.push(node);
  });

  const sortReplies = (nodes: SerializedComment[]) => {
    nodes.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    nodes.forEach((node) => sortReplies(node.replies));
  };

  sortReplies(roots);
  return roots;
};

function serializeZodError(error: z.ZodError) {
  const flattened = error.flatten();
  return flattened.formErrors.join("\n") || Object.values(flattened.fieldErrors).flat().join("\n");
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

  const comments = await prisma.promptComment.findMany({
    where: { promptId: prompt.id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(serializeComments(comments));
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = parseWorkspace(req);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: serializeZodError(parsed.error) }, { status: 400 });
  }

  const prompt = await prisma.prompt.findFirst({
    where: buildAccessFilter(params.id, session.user.id),
    select: { id: true, ownerId: true, teamId: true },
  });

  if (!prompt || !promptMatchesWorkspace(prompt, session.user.id, workspace)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const { body, parentId } = parsed.data;

  if (parentId) {
    const parent = await prisma.promptComment.findFirst({
      where: { id: parentId, promptId: prompt.id },
      select: { id: true },
    });
    if (!parent) {
      return NextResponse.json({ error: "Parent comment not found." }, { status: 404 });
    }
  }

  const comment = await prisma.promptComment.create({
    data: {
      promptId: prompt.id,
      authorId: session.user.id,
      parentId: parentId ?? null,
      body: body.trim(),
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  const serialized = serializeComments([comment])[0];
  return NextResponse.json(serialized, { status: 201 });
}
