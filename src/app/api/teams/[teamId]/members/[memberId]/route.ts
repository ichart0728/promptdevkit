import { TeamRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import {
  canRemoveMember,
  canUpdateMemberRole,
  canPromoteToRole,
  getTeamMembershipContext,
} from "@/lib/team-permissions";

const updateMemberSchema = z
  .object({
    role: z.nativeEnum(TeamRole),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, memberId } = params;
  if (!teamId || !memberId) {
    return NextResponse.json({ error: "Team and member IDs are required." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[teams:member:update] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = updateMemberSchema.safeParse(payload);
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

  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (!canUpdateMemberRole(membershipContext, member)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!canPromoteToRole(membershipContext, parsed.data.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.teamMember.update({
    where: { id: memberId },
    data: { role: parsed.data.role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { teamId: string; memberId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, memberId } = params;
  if (!teamId || !memberId) {
    return NextResponse.json({ error: "Team and member IDs are required." }, { status: 400 });
  }

  const membershipContext = await getTeamMembershipContext(
    teamId,
    session.user.id
  );

  if (!membershipContext) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
    select: {
      id: true,
      userId: true,
      role: true,
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  if (!canRemoveMember(membershipContext, member)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.teamMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({}, { status: 204 });
}
