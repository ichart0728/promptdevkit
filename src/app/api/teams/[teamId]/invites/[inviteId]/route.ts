import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { calculateInviteExpiration } from "@/lib/team-invite";
import { canInviteMembers, getTeamMembershipContext } from "@/lib/team-permissions";

const updateInviteSchema = z
  .object({
    action: z.enum(["resend"]),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; inviteId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, inviteId } = params;
  if (!teamId || !inviteId) {
    return NextResponse.json({ error: "Team and invite IDs are required." }, { status: 400 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch (error) {
    console.warn("[teams:invite:update] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = updateInviteSchema.safeParse(payload);
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

  if (!canInviteMembers(membershipContext)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invite = await prisma.teamInvite.findFirst({
    where: { id: inviteId, teamId },
    include: {
      invitedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite is no longer active." }, { status: 400 });
  }

  if (parsed.data.action === "resend") {
    const updated = await prisma.teamInvite.update({
      where: { id: inviteId },
      data: {
        sentAt: new Date(),
        expiresAt: calculateInviteExpiration(),
      },
      include: {
        invitedBy: {
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

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { teamId: string; inviteId: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, inviteId } = params;
  if (!teamId || !inviteId) {
    return NextResponse.json({ error: "Team and invite IDs are required." }, { status: 400 });
  }

  const membershipContext = await getTeamMembershipContext(
    teamId,
    session.user.id
  );

  if (!membershipContext) {
    return NextResponse.json({ error: "Team not found." }, { status: 404 });
  }

  if (!canInviteMembers(membershipContext)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invite = await prisma.teamInvite.findFirst({
    where: { id: inviteId, teamId },
    select: { status: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite is no longer active." }, { status: 400 });
  }

  await prisma.teamInvite.update({
    where: { id: inviteId },
    data: {
      status: "revoked",
      revokedAt: new Date(),
    },
  });

  return NextResponse.json({}, { status: 204 });
}
