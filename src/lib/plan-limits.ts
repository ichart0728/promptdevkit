import { prisma } from "@/lib/prisma";
import { FREE_PLAN_MEMBER_LIMIT, FREE_PLAN_TEAM_LIMIT } from "@/lib/plan-constants";

export type PlanLimitCode = "team-limit" | "team-member-limit";

export class PlanLimitExceededError extends Error {
  readonly code: PlanLimitCode;

  constructor(code: PlanLimitCode, message: string) {
    super(message);
    this.code = code;
    this.name = "PlanLimitExceededError";
  }
}

const hasLimit = (limit: number) => Number.isFinite(limit) && limit > 0;

export async function assertTeamCreationLimit(ownerId: string | null | undefined) {
  if (!ownerId || !hasLimit(FREE_PLAN_TEAM_LIMIT)) {
    return;
  }

  const count = await prisma.team.count({
    where: {
      ownerId,
      deletedAt: null,
    },
  });

  if (count >= FREE_PLAN_TEAM_LIMIT) {
    const noun = FREE_PLAN_TEAM_LIMIT === 1 ? "team" : "teams";
    throw new PlanLimitExceededError(
      "team-limit",
      `Free plan supports up to ${FREE_PLAN_TEAM_LIMIT} ${noun}. Upgrade to create more teams.`,
    );
  }
}

export async function assertTeamMemberLimit(teamId: string | null | undefined) {
  if (!teamId || !hasLimit(FREE_PLAN_MEMBER_LIMIT)) {
    return;
  }

  const [memberCount, pendingInvites] = await Promise.all([
    prisma.teamMember.count({
      where: {
        teamId,
      },
    }),
    prisma.teamInvite.count({
      where: {
        teamId,
        status: "pending",
      },
    }),
  ]);

  const total = memberCount + pendingInvites;

  if (total >= FREE_PLAN_MEMBER_LIMIT) {
    const noun = FREE_PLAN_MEMBER_LIMIT === 1 ? "member" : "members";
    throw new PlanLimitExceededError(
      "team-member-limit",
      `Free plan supports up to ${FREE_PLAN_MEMBER_LIMIT} ${noun} per team. Upgrade to add more teammates.`,
    );
  }
}
