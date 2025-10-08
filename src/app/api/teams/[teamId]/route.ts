import { NextResponse } from "next/server";
import { z } from "zod";

import type { Prisma } from "@prisma/client";

import { FREE_PLAN_MEMBER_LIMIT, FREE_PLAN_TEAM_LIMIT } from "@/lib/plan-constants";
import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import {
  canDeleteTeam,
  canEditTeam,
  canInviteMembers,
  canLeaveTeam,
  canManageMembers,
  canTransferOwnership,
  getTeamMembershipContext,
  isTeamOwner,
} from "@/lib/team-permissions";

const updateTeamSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Team name is required.")
      .max(120, "Team name must be 120 characters or fewer.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer.")
      .transform((value) => (value.length ? value : null))
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updates provided.",
  });

const hasLimit = (limit: number) => Number.isFinite(limit) && limit > 0;

const planType: "free" | "paid" =
  hasLimit(FREE_PLAN_TEAM_LIMIT) || hasLimit(FREE_PLAN_MEMBER_LIMIT)
    ? "free"
    : "paid";

const teamDetailInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  members: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  invites: {
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.TeamInclude;

type TeamDetailPayload = Prisma.TeamGetPayload<{
  include: typeof teamDetailInclude;
}>;

function mapTeamDetail(
  team: TeamDetailPayload,
  currentUserId: string,
  membershipRole: string
) {
  const pendingInviteCount = team.invites.filter(
    (invite) => invite.status === "pending"
  ).length;
  const activeMemberCount = team.members.length;
  const totalSeats = activeMemberCount + pendingInviteCount;
  const memberLimit = hasLimit(FREE_PLAN_MEMBER_LIMIT)
    ? FREE_PLAN_MEMBER_LIMIT
    : null;
  const remainingSeats =
    memberLimit !== null ? Math.max(memberLimit - totalSeats, 0) : null;

  return {
    team: {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
      inviteCode: team.inviteCode,
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
    },
    currentUser: {
      id: currentUserId,
      role: membershipRole,
    },
    members: team.members.map((member) => ({
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
      status: "active" as const,
      isOwner: team.owner?.id === member.userId,
      isCurrentUser: member.userId === currentUserId,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      },
    })),
    invites: team.invites.map((invite) => ({
      id: invite.id,
      teamId: invite.teamId,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      token: invite.token,
      expiresAt: invite.expiresAt ? invite.expiresAt.toISOString() : null,
      sentAt: invite.sentAt ? invite.sentAt.toISOString() : null,
      acceptedAt: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
      revokedAt: invite.revokedAt ? invite.revokedAt.toISOString() : null,
      createdAt: invite.createdAt.toISOString(),
      updatedAt: invite.updatedAt.toISOString(),
      invitedBy: {
        id: invite.invitedBy.id,
        name: invite.invitedBy.name,
        email: invite.invitedBy.email,
      },
    })),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = params.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
  }

  const membershipContext = await getTeamMembershipContext(
    teamId,
    session.user.id
  );

  if (!membershipContext) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    include: teamDetailInclude,
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const detail = mapTeamDetail(
    team,
    session.user.id,
    membershipContext.membership.role
  );

  return NextResponse.json({
    ...detail,
    permissions: {
      canInvite: canInviteMembers(membershipContext),
      canManageMembers: canManageMembers(membershipContext),
      canEditTeam: canEditTeam(membershipContext),
      canDeleteTeam: canDeleteTeam(membershipContext),
      canTransferOwnership: canTransferOwnership(membershipContext),
      canLeaveTeam: canLeaveTeam(membershipContext),
      isOwner: isTeamOwner(membershipContext),
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = params.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
  }

  const membershipContext = await getTeamMembershipContext(
    teamId,
    session.user.id
  );

  if (!membershipContext) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  if (!canEditTeam(membershipContext)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[teams:update] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = updateTeamSchema.safeParse(payload);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return NextResponse.json(
      {
        error: {
          fieldErrors: flattened.fieldErrors,
          formErrors: flattened.formErrors,
        },
      },
      { status: 400 }
    );
  }

  await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
    },
  });

  const team = await prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    include: teamDetailInclude,
  });

  if (!team) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const detail = mapTeamDetail(
    team,
    session.user.id,
    membershipContext.membership.role
  );

  return NextResponse.json({
    ...detail,
    permissions: {
      canInvite: canInviteMembers(membershipContext),
      canManageMembers: canManageMembers(membershipContext),
      canEditTeam: canEditTeam(membershipContext),
      canDeleteTeam: canDeleteTeam(membershipContext),
      canTransferOwnership: canTransferOwnership(membershipContext),
      canLeaveTeam: canLeaveTeam(membershipContext),
      isOwner: isTeamOwner(membershipContext),
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { teamId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = params.teamId;
  if (!teamId) {
    return NextResponse.json({ error: "Team ID is required." }, { status: 400 });
  }

  const membershipContext = await getTeamMembershipContext(
    teamId,
    session.user.id
  );

  if (!membershipContext) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  if (!canDeleteTeam(membershipContext)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.team.update({
    where: { id: teamId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({}, { status: 204 });
}
