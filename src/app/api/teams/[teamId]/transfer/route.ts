import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { canTransferOwnership, getTeamMembershipContext } from "@/lib/team-permissions";

const transferSchema = z
  .object({
    memberId: z.string().trim().min(1, "Member ID is required."),
  })
  .strict();

export async function POST(
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

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[teams:transfer] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = transferSchema.safeParse(payload);
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

  const membershipContext = await getTeamMembershipContext(
    teamId,
    session.user.id
  );

  if (!membershipContext) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  if (!canTransferOwnership(membershipContext)) {
    return NextResponse.json({ error: "Only the current owner can transfer ownership." }, { status: 403 });
  }

  const targetMember = await prisma.teamMember.findFirst({
    where: {
      id: parsed.data.memberId,
      teamId,
    },
  });

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (targetMember.userId === membershipContext.membership.userId) {
    return NextResponse.json(
      { error: "You already own this team." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.team.update({
      where: { id: teamId },
      data: { ownerId: targetMember.userId },
    });

    await tx.teamMember.update({
      where: { id: targetMember.id },
      data: { role: "admin" },
    });
  });

  return NextResponse.json({}, { status: 204 });
}
