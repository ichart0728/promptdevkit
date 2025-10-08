import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionOrDev } from "@/lib/session";

export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const session = await getSessionOrDev();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = params.token;
  if (!token) {
    return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  }

  const invite = await prisma.teamInvite.findFirst({
    where: {
      token,
      status: "pending",
      team: { deletedAt: null },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Invite has expired." }, { status: 410 });
  }

  if (invite.email && session.user.email) {
    const normalizedInviteEmail = invite.email.trim().toLowerCase();
    const normalizedUserEmail = session.user.email.trim().toLowerCase();
    if (normalizedInviteEmail !== normalizedUserEmail) {
      return NextResponse.json(
        { error: "This invite was sent to a different email." },
        { status: 403 }
      );
    }
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId: invite.teamId,
      userId: session.user.id,
    },
  });

  if (existingMember) {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json(existingMember);
  }

  const membership = await prisma.$transaction(async (tx) => {
    const createdMember = await tx.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: session.user.id,
        role: invite.role,
      },
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

    await tx.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    });

    return createdMember;
  });

  return NextResponse.json(membership, { status: 201 });
}
