import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@prisma/client";

import { FREE_PLAN_MEMBER_LIMIT, FREE_PLAN_TEAM_LIMIT } from "@/lib/plan-constants";
import {
  PlanLimitExceededError,
  assertTeamCreationLimit,
} from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";

const createTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Team name is required.")
      .max(120, "Team name must be 120 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer.")
      .optional(),
  })
  .strict();

const hasLimit = (limit: number) => Number.isFinite(limit) && limit > 0;

const planType: "free" | "paid" =
  hasLimit(FREE_PLAN_TEAM_LIMIT) || hasLimit(FREE_PLAN_MEMBER_LIMIT)
    ? "free"
    : "paid";

const teamSummarySelect = Prisma.validator<Prisma.TeamSelect>()({
  id: true,
  name: true,
  description: true,
  inviteCode: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  members: {
    select: {
      id: true,
      userId: true,
      role: true,
    },
  },
});

type TeamWithSummaryRelations = Prisma.TeamGetPayload<{
  select: typeof teamSummarySelect;
}>;

function mapTeamSummary(
  team: TeamWithSummaryRelations,
  userId: string,
  pendingInviteCount: number
) {
  const activeMemberCount = team.members.length;
  const totalSeats = activeMemberCount + pendingInviteCount;
  const memberLimit = hasLimit(FREE_PLAN_MEMBER_LIMIT)
    ? FREE_PLAN_MEMBER_LIMIT
    : null;
  const remainingSeats =
    memberLimit !== null ? Math.max(memberLimit - totalSeats, 0) : null;

  const currentMember = team.members.find((member) => member.userId === userId);

  return {
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    createdAt: team.createdAt.toISOString(),
    updatedAt: team.updatedAt.toISOString(),
    inviteCode: team.inviteCode ?? null,
    owner: team.owner
      ? {
          id: team.owner.id,
          name: team.owner.name,
          email: team.owner.email,
        }
      : null,
    metrics: {
      memberCount: activeMemberCount,
      pendingInviteCount,
    },
    plan: {
      type: planType,
      teamLimit: hasLimit(FREE_PLAN_TEAM_LIMIT) ? FREE_PLAN_TEAM_LIMIT : null,
      memberLimit,
      usedSeats: totalSeats,
      remainingSeats,
      memberLimitReached:
        memberLimit !== null ? totalSeats >= memberLimit : false,
    },
    currentUserRole: currentMember?.role ?? null,
  };
}

export async function GET() {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: session.user.id,
      team: { deletedAt: null },
    },
    select: {
      teamId: true,
    },
  });

  const teamIds = memberships.map((membership) => membership.teamId);
  if (teamIds.length === 0) {
    return NextResponse.json([]);
  }

  const [teams, pendingInviteGroups] = await Promise.all([
    prisma.team.findMany({
      where: {
        id: { in: teamIds },
        deletedAt: null,
      },
      select: teamSummarySelect,
      orderBy: { createdAt: "asc" },
    }),
    prisma.teamInvite.groupBy({
      by: ["teamId"],
      where: {
        teamId: { in: teamIds },
        status: "pending",
      },
      _count: { teamId: true },
    }),
  ]);

  const pendingInviteMap = new Map<string, number>();
  pendingInviteGroups.forEach((group) => {
    pendingInviteMap.set(group.teamId, group._count.teamId);
  });

  const summaries = teams
    .map((team) =>
      mapTeamSummary(team, session.user.id, pendingInviteMap.get(team.id) ?? 0)
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  return NextResponse.json(summaries);
}

export async function POST(req: Request) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[teams:create] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createTeamSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    await assertTeamCreationLimit(session.user.id);
  } catch (error) {
    if (error instanceof PlanLimitExceededError) {
      return NextResponse.json(
        {
          error: {
            code: "limit_exceeded",
            message: error.message,
            metadata: error.metadata,
          },
        },
        { status: 402 }
      );
    }
    throw error;
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      inviteCode: randomUUID(),
      ownerId: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          role: "admin",
        },
      },
    },
    select: teamSummarySelect,
  });

  const summary = mapTeamSummary(team, session.user.id, 0);

  return NextResponse.json(summary, { status: 201 });
}
