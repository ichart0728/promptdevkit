import type { TeamMember, TeamRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TeamMembershipContext = {
  membership: Pick<TeamMember, "id" | "teamId" | "userId" | "role"> & {
    team: {
      id: string;
      ownerId: string | null;
      inviteCode: string | null;
      name: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    };
  };
};

export const isTeamOwner = (context: TeamMembershipContext) =>
  context.membership.team.ownerId === context.membership.userId;

export const canManageMembers = (context: TeamMembershipContext) =>
  isTeamOwner(context) || context.membership.role === "admin";

export const canInviteMembers = canManageMembers;

export const canEditTeam = (context: TeamMembershipContext) =>
  isTeamOwner(context) || context.membership.role === "admin";

export const canDeleteTeam = (context: TeamMembershipContext) =>
  isTeamOwner(context);

export const canTransferOwnership = (context: TeamMembershipContext) =>
  isTeamOwner(context);

export const canLeaveTeam = (context: TeamMembershipContext) =>
  !isTeamOwner(context);

export function canRemoveMember(
  context: TeamMembershipContext,
  target: Pick<TeamMember, "userId" | "role">
) {
  if (!canManageMembers(context)) {
    return false;
  }

  if (context.membership.userId === target.userId) {
    return false;
  }

  if (context.membership.team.ownerId === target.userId) {
    return false;
  }

  if (!isTeamOwner(context) && target.role === "admin") {
    return false;
  }

  return true;
}

export function canUpdateMemberRole(
  context: TeamMembershipContext,
  target: Pick<TeamMember, "userId" | "role">
) {
  if (!canManageMembers(context)) {
    return false;
  }

  if (context.membership.userId === target.userId) {
    return false;
  }

  if (context.membership.team.ownerId === target.userId) {
    return false;
  }

  if (!isTeamOwner(context) && target.role === "admin") {
    return false;
  }

  return true;
}

export function canPromoteToRole(
  context: TeamMembershipContext,
  role: TeamRole
) {
  if (!canManageMembers(context)) {
    return false;
  }

  if (role === "admin" && !isTeamOwner(context)) {
    return false;
  }

  return true;
}

export async function getTeamMembershipContext(
  teamId: string,
  userId: string
): Promise<TeamMembershipContext | null> {
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId,
      team: { deletedAt: null },
    },
    include: {
      team: {
        select: {
          id: true,
          ownerId: true,
          inviteCode: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return { membership };
}
