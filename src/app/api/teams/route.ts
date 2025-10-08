import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";

export async function GET() {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.teamMember.findMany({
    where: {
      userId: session.user.id,
      team: {
        deletedAt: null,
      },
    },
    select: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      team: {
        name: "asc",
      },
    },
  });

  const seen = new Set<string>();
  const teams = memberships
    .map((membership) => membership.team)
    .filter((team): team is { id: string; name: string } => {
      if (!team) return false;
      if (seen.has(team.id)) return false;
      seen.add(team.id);
      return true;
    });

  return NextResponse.json(teams);
}
