import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { canLeaveTeam, getTeamMembershipContext } from "@/lib/team-permissions";

export async function POST(
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

  if (!canLeaveTeam(membershipContext)) {
    return NextResponse.json({ error: "Owners must transfer ownership before leaving." }, { status: 403 });
  }

  await prisma.teamMember.delete({
    where: { id: membershipContext.membership.id },
  });

  return NextResponse.json({}, { status: 204 });
}
