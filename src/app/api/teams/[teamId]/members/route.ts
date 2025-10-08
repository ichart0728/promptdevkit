import { randomUUID } from "crypto";
import { TeamRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { assertTeamMemberLimit, PlanLimitExceededError } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";
import { calculateInviteExpiration } from "@/lib/team-invite";
import { canInviteMembers, getTeamMembershipContext } from "@/lib/team-permissions";

const inviteMemberSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Enter a valid email address."),
    role: z.nativeEnum(TeamRole).optional(),
  })
  .strict();

const normalizeEmail = (value: string) => value.trim().toLowerCase();

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
    console.warn("[teams:invite] Invalid JSON payload", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = inviteMemberSchema.safeParse(payload);
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

  const normalizedEmail = normalizeEmail(parsed.data.email);

  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      user: {
        email: normalizedEmail,
        deletedAt: null,
      },
    },
  });

  if (existingMember) {
    return NextResponse.json(
      { error: "User is already a member of this team." },
      { status: 409 }
    );
  }

  const existingInvite = await prisma.teamInvite.findFirst({
    where: {
      teamId,
      email: normalizedEmail,
      status: "pending",
    },
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invite has already been sent to this email." },
      { status: 409 }
    );
  }

  try {
    await assertTeamMemberLimit(teamId);

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email: normalizedEmail,
        role: parsed.data.role ?? "member",
        token: randomUUID(),
        status: "pending",
        expiresAt: calculateInviteExpiration(),
        invitedById: session.user.id,
        sentAt: new Date(),
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

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof PlanLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("[teams:invite] Unexpected error", {
      error,
    });
    return NextResponse.json(
      { error: "Failed to send invite." },
      { status: 500 }
    );
  }
}
