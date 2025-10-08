export type TeamRole = "member" | "editor" | "viewer" | "admin";

export type TeamInviteStatus = "pending" | "accepted" | "revoked" | "expired";

export type TeamPlanSummary = {
  type: "free" | "paid";
  teamLimit: number | null;
  memberLimit: number | null;
  usedSeats: number;
  remainingSeats: number | null;
  memberLimitReached: boolean;
};

export type TeamOwnerSummary = {
  id: string;
  name: string | null;
  email: string | null;
};

export type TeamSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  inviteCode: string | null;
  owner: TeamOwnerSummary | null;
  metrics: {
    memberCount: number;
    pendingInviteCount: number;
  };
  plan: TeamPlanSummary;
  currentUserRole: TeamRole | null;
};

export type TeamMemberWithUser = {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
  status: "active";
  isOwner: boolean;
  isCurrentUser: boolean;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type TeamInviteSummary = {
  id: string;
  teamId: string;
  email: string | null;
  role: TeamRole;
  status: TeamInviteStatus;
  token: string;
  expiresAt: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  invitedBy: TeamOwnerSummary;
};

export type TeamDetail = {
  team: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    inviteCode: string | null;
    owner: TeamOwnerSummary | null;
    metrics: {
      memberCount: number;
      pendingInviteCount: number;
    };
    plan: TeamPlanSummary;
  };
  currentUser: {
    id: string;
    role: TeamRole | null;
  };
  members: TeamMemberWithUser[];
  invites: TeamInviteSummary[];
  permissions: {
    canInvite: boolean;
    canManageMembers: boolean;
    canEditTeam: boolean;
    canDeleteTeam: boolean;
    canTransferOwnership: boolean;
    canLeaveTeam: boolean;
    isOwner: boolean;
  };
};
