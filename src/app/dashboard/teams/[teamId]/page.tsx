"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PlanUsageMeter } from "@/components/teams/PlanUsageMeter";
import { Toast } from "@/components/teams/Toast";
import { UpgradeModal } from "@/components/teams/UpgradeModal";
import {
  cancelTeamInvite,
  deleteTeam,
  getTeam,
  inviteTeamMember,
  leaveTeam,
  removeTeamMember,
  resendTeamInvite,
  rotateTeamInviteLink,
  transferTeamOwnership,
  updateTeam,
  updateTeamMemberRole,
} from "@/lib/api";
import { FREE_PLAN_MEMBER_LIMIT } from "@/lib/plan-constants";
import { TeamDetail, TeamInviteSummary, TeamMemberWithUser, TeamRole } from "@/types/team";

const roleLabels: Record<TeamRole, string> = {
  admin: "Admin",
  editor: "Editor",
  member: "Member",
  viewer: "Viewer",
};

type FetchError = Error & { status?: number };

const isFetchError = (error: unknown): error is FetchError =>
  typeof error === "object" && error !== null && "status" in error;

const inviteStatusLabels: Record<string, string> = {
  pending: "Invited",
  accepted: "Accepted",
  revoked: "Revoked",
  expired: "Expired",
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function TeamDetailPage() {
  const params = useParams<{ teamId: string }>();
  const router = useRouter();
  const teamId = params.teamId;

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [memberPending, setMemberPending] = useState<Record<string, boolean>>({});
  const [invitePending, setInvitePending] = useState<Record<string, boolean>>({});
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    tone?: "success" | "error" | "info";
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [inviteBaseUrl, setInviteBaseUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteBaseUrl(window.location.origin);
    }
  }, []);

  const loadTeam = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const detail = await getTeam(teamId);
      setTeam(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team.");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const memberLimitReached = useMemo(() => {
    if (!team) return false;
    return Boolean(team.team.plan.memberLimitReached);
  }, [team]);

  const handleViewPrompts = useCallback(() => {
    if (!team) return;
    const params = new URLSearchParams();
    params.set("teamId", team.team.id);
    if (team.team.name) {
      params.set("teamName", team.team.name);
    }
    setSidebarOpen(false);
    setMenuOpen(false);
    router.push(`/dashboard?${params.toString()}`);
  }, [router, team]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!team || inviteLoading) return;

    const normalizedEmail = inviteEmail.trim();
    if (!normalizedEmail) {
      setInviteError("Email is required.");
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    try {
      await inviteTeamMember(team.team.id, {
        email: normalizedEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      setInviteRole("member");
      setToast({
        title: "Invite sent",
        description: `${normalizedEmail} can join ${team.team.name}.`,
        tone: "success",
      });
      await loadTeam();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invite.";
      setInviteError(message);
      if (isFetchError(err) && err.status === 403) {
        setUpgradeMessage(message);
        setUpgradeOpen(true);
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const updateMember = async (memberId: string, role: TeamRole) => {
    if (!team) return;
    setMemberPending((current) => ({ ...current, [memberId]: true }));
    try {
      await updateTeamMemberRole(team.team.id, memberId, role);
      setToast({
        title: "Role updated",
        tone: "success",
      });
      await loadTeam();
    } catch (err) {
      setToast({
        title: "Unable to change role",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setMemberPending((current) => ({ ...current, [memberId]: false }));
    }
  };

  const removeMemberHandler = async (memberId: string) => {
    if (!team) return;
    setMemberPending((current) => ({ ...current, [memberId]: true }));
    try {
      await removeTeamMember(team.team.id, memberId);
      setToast({
        title: "Member removed",
        tone: "info",
      });
      await loadTeam();
    } catch (err) {
      setToast({
        title: "Unable to remove member",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setMemberPending((current) => ({ ...current, [memberId]: false }));
    }
  };

  const resendInviteHandler = async (invite: TeamInviteSummary) => {
    if (!team) return;
    setInvitePending((current) => ({ ...current, [invite.id]: true }));
    try {
      await resendTeamInvite(team.team.id, invite.id);
      setToast({
        title: "Invite resent",
        tone: "info",
      });
      await loadTeam();
    } catch (err) {
      setToast({
        title: "Unable to resend invite",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setInvitePending((current) => ({ ...current, [invite.id]: false }));
    }
  };

  const cancelInviteHandler = async (invite: TeamInviteSummary) => {
    if (!team) return;
    setInvitePending((current) => ({ ...current, [invite.id]: true }));
    try {
      await cancelTeamInvite(team.team.id, invite.id);
      setToast({
        title: "Invite cancelled",
        tone: "info",
      });
      await loadTeam();
    } catch (err) {
      setToast({
        title: "Unable to cancel invite",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setInvitePending((current) => ({ ...current, [invite.id]: false }));
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    try {
      await leaveTeam(team.team.id);
      router.push("/dashboard/teams");
    } catch (err) {
      setToast({
        title: "Unable to leave team",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    }
  };

  const handleTransferOwnership = async (member: TeamMemberWithUser) => {
    if (!team) return;
    setMemberPending((current) => ({ ...current, [member.id]: true }));
    try {
      await transferTeamOwnership(team.team.id, member.id);
      setToast({
        title: "Ownership transferred",
        description: `${member.user.name ?? member.user.email ?? "Member"} is now the owner.`,
        tone: "success",
      });
      await loadTeam();
    } catch (err) {
      setToast({
        title: "Unable to transfer ownership",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setMemberPending((current) => ({ ...current, [member.id]: false }));
    }
  };

  const handleRotateInviteLink = async () => {
    if (!team) return;
    setInvitePending((current) => ({ ...current, link: true }));
    setMenuOpen(false);
    try {
      const result = await rotateTeamInviteLink(team.team.id);
      setTeam((current) =>
        current
          ? {
              ...current,
              team: {
                ...current.team,
                inviteCode: result.inviteCode,
              },
            }
          : current
      );
      setToast({
        title: "Invite link refreshed",
        tone: "success",
      });
    } catch (err) {
      setToast({
        title: "Unable to refresh link",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setInvitePending((current) => ({ ...current, link: false }));
    }
  };

  const handleCopyInviteLink = async () => {
    if (!team || !team.team.inviteCode) return;
    const link = inviteBaseUrl
      ? `${inviteBaseUrl}/teams/invite/${team.team.inviteCode}`
      : team.team.inviteCode;
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(link);
      setToast({
        title: "Invite link copied",
        tone: "success",
      });
    } catch {
      setToast({
        title: "Unable to copy invite link",
        tone: "error",
      });
    }
  };

  const openEditModal = () => {
    if (!team) return;
    setEditName(team.team.name);
    setEditDescription(team.team.description ?? "");
    setEditError(null);
    setEditOpen(true);
    setMenuOpen(false);
  };

  const handleUpdateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!team || editLoading) return;

    const trimmedName = editName.trim();
    const trimmedDescription = editDescription.trim();
    if (!trimmedName) {
      setEditError("Team name is required.");
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await updateTeam(team.team.id, {
        name: trimmedName,
        description: trimmedDescription || null,
      });
      setTeam(updated);
      setToast({
        title: "Team updated",
        tone: "success",
      });
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update team.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!team || deleting) return;
    setMenuOpen(false);
    const confirmed = window.confirm(
      "Are you sure you want to delete this team? This cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteTeam(team.team.id);
      router.push("/dashboard/teams");
    } catch (err) {
      setToast({
        title: "Unable to delete team",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
      setDeleting(false);
    }
  };

  const members = team?.members ?? [];
  const invites = team?.invites ?? [];

  const canInvite = Boolean(team?.permissions.canInvite);
  const canManageMembers = Boolean(team?.permissions.canManageMembers);
  const canLeave = Boolean(team?.permissions.canLeaveTeam);
  const canTransferOwnership = Boolean(team?.permissions.canTransferOwnership);
  const isOwner = Boolean(team?.permissions.isOwner);

  const renderTeamActions = () => {
    if (!team) return null;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleViewPrompts}
          className="rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200"
          aria-label="Go to this team's prompts"
        >
          Team prompts
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            Settings
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              role="menu"
            >
              <button
                type="button"
                onClick={openEditModal}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Edit team
              </button>
              <button
                type="button"
                onClick={handleCopyInviteLink}
                disabled={!team.team.inviteCode}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100 disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Copy invite link
              </button>
              <button
                type="button"
                onClick={handleRotateInviteLink}
                disabled={invitePending.link}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100 disabled:opacity-60 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Refresh invite link
              </button>
              <Link
                href="/docs/permissions"
                className="block px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Permissions
              </Link>
              {isOwner ? (
                <button
                  type="button"
                  onClick={handleDeleteTeam}
                  disabled={deleting}
                  className="block w-full px-4 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:bg-rose-50 disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-500/20"
                >
                  Delete team
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/teams")}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Back to teams"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {team?.team.name ?? "Team"}
            </h1>
          </div>
          {renderTeamActions()}
        </header>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading team details…
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        ) : team ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            <aside
              className={`lg:w-60 ${
                sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full lg:translate-x-0"
              } transform transition-transform duration-300 ease-out`}
            >
              <nav className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Sections
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>
                    <button
                      type="button"
                      onClick={handleViewPrompts}
                      className="w-full text-left hover:text-violet-600 focus:outline-none focus-visible:text-violet-600"
                      aria-label="Open prompts filtered to this team"
                    >
                      Team prompts
                    </button>
                  </li>
                  <li>
                    <a className="hover:text-violet-600" href="#overview">
                      Overview
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-violet-600" href="#members">
                      Members
                    </a>
                  </li>
                  <li>
                    <a className="hover:text-violet-600" href="#settings">
                      Settings
                    </a>
                  </li>
                </ul>
              </nav>
            </aside>

            <div className="flex-1 space-y-6">
              <section
                id="overview"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Team overview
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage invite links, understand plan usage, and see key metadata at a glance.
                      </p>
                      {team.team.description ? (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {team.team.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                          No description provided.
                        </p>
                      )}
                    </div>
                    <div className="rounded-full border border-violet-200 bg-violet-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200">
                      {team.team.plan.type === "paid" ? "Pro plan" : "Free plan"}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <dl className="grid gap-3 rounded-2xl border border-slate-200 p-4 shadow-inner dark:border-slate-800">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Created
                        </dt>
                        <dd className="text-sm text-slate-700 dark:text-slate-300">
                          {dateFormatter.format(new Date(team.team.createdAt))}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Owner
                        </dt>
                        <dd className="text-sm text-slate-700 dark:text-slate-300">
                          {team.team.owner?.name ?? team.team.owner?.email ?? "Unassigned"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Members
                        </dt>
                        <dd className="text-sm text-slate-700 dark:text-slate-300">
                          {team.team.metrics.memberCount} members
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Pending invites
                        </dt>
                        <dd className="text-sm text-slate-700 dark:text-slate-300">
                          {team.team.metrics.pendingInviteCount}
                        </dd>
                      </div>
                    </dl>
                    <div className="rounded-2xl border border-slate-200 p-4 shadow-inner dark:border-slate-800">
                      <PlanUsageMeter plan={team.team.plan} label="Seats" />
                      {memberLimitReached ? (
                        <p className="mt-2 text-xs text-violet-600 dark:text-violet-300">
                          Seat limit reached. Upgrade to add more teammates.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Free plan supports up to {FREE_PLAN_MEMBER_LIMIT} members per team.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 shadow-inner dark:border-slate-800">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Invite link
                        </span>
                        <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                          {team.team.inviteCode
                            ? `${inviteBaseUrl}/teams/invite/${team.team.inviteCode}`
                            : "Generate a link to invite members."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyInviteLink}
                          disabled={!team.team.inviteCode}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={handleRotateInviteLink}
                          disabled={invitePending.link}
                          className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section
                id="members"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Members & invites
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Manage member roles, pending invites, and ownership transfers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen((value) => !value)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
                    >
                      {sidebarOpen ? "Hide menu" : "Show menu"}
                    </button>
                  </div>

                  {canInvite ? (
                    <form
                      onSubmit={handleInvite}
                      className="grid gap-3 rounded-2xl border border-slate-200 p-4 shadow-inner dark:border-slate-800"
                    >
                      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                        <label className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            Email
                          </span>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(event) => {
                              setInviteEmail(event.target.value);
                              setInviteError(null);
                            }}
                            placeholder="teammate@example.com"
                            disabled={inviteLoading || memberLimitReached}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-500 dark:focus-visible:ring-violet-500"
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                            Role
                          </span>
                          <select
                            value={inviteRole}
                            onChange={(event) =>
                              setInviteRole(event.target.value as TeamRole)
                            }
                            disabled={inviteLoading || memberLimitReached}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-500 dark:focus-visible:ring-violet-500"
                          >
                            {Object.entries(roleLabels).map(([role, label]) => (
                              <option key={role} value={role}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {inviteError ? (
                        <p className="text-xs text-rose-500" role="alert">
                          {inviteError}
                        </p>
                      ) : memberLimitReached ? (
                        <p className="text-xs text-violet-600 dark:text-violet-300">
                          Seat limit reached. Upgrade to add more teammates.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Invites are sent instantly. Pending members count toward your seat limit.
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={inviteLoading || memberLimitReached}
                        className="self-start rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-violet-500"
                      >
                        {inviteLoading ? "Sending…" : "Send invite"}
                      </button>
                    </form>
                  ) : null}

                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
                    <div className="max-h-[480px] overflow-auto">
                      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left">
                              Member
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                              Role
                            </th>
                            <th scope="col" className="px-4 py-3 text-left">
                              Status
                            </th>
                            <th scope="col" className="px-4 py-3 text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {members.map((member) => {
                            const pending = Boolean(memberPending[member.id]);
                            return (
                              <tr key={member.id} className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      {member.user.name ?? member.user.email ?? "Member"}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {member.user.email ?? "No email"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {canManageMembers && !member.isOwner ? (
                                    <select
                                      value={member.role}
                                      disabled={pending}
                                      onChange={(event) =>
                                        updateMember(
                                          member.id,
                                          event.target.value as TeamRole
                                        )
                                      }
                                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 transition focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                      aria-label={`Change role for ${member.user.name ?? member.user.email ?? "member"}`}
                                    >
                                      {Object.entries(roleLabels).map(([role, label]) => (
                                        <option key={role} value={role}>
                                          {label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                      {roleLabels[member.role]}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                    Active
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    {canTransferOwnership && !member.isOwner ? (
                                      <button
                                        type="button"
                                        onClick={() => handleTransferOwnership(member)}
                                        disabled={pending}
                                        className="rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200"
                                        aria-label={`Transfer ownership to ${member.user.name ?? member.user.email ?? "member"}`}
                                      >
                                        Transfer
                                      </button>
                                    ) : null}
                                    {canManageMembers && !member.isOwner ? (
                                      <button
                                        type="button"
                                        onClick={() => removeMemberHandler(member.id)}
                                        disabled={pending}
                                        className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200"
                                        aria-label={`Remove ${member.user.name ?? member.user.email ?? "member"}`}
                                      >
                                        Remove
                                      </button>
                                    ) : null}
                                    {member.isCurrentUser && canLeave ? (
                                      <button
                                        type="button"
                                        onClick={handleLeaveTeam}
                                        className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                      >
                                        Leave
                                      </button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {invites.map((invite) => {
                            const pending = Boolean(invitePending[invite.id]);
                            return (
                              <tr
                                key={invite.id}
                                className="bg-violet-50/50 hover:bg-violet-50 dark:bg-violet-500/10 dark:hover:bg-violet-500/15"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      {invite.email ?? "Invite link"}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      Invited by {invite.invitedBy.name ?? invite.invitedBy.email ?? "Member"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                  {roleLabels[invite.role]}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                    {inviteStatusLabels[invite.status] ?? invite.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    {invite.status === "pending" ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => resendInviteHandler(invite)}
                                          disabled={pending}
                                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                                        >
                                          Resend
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => cancelInviteHandler(invite)}
                                          disabled={pending}
                                          className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              <section
                id="settings"
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Role capabilities
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Owners control billing and transfers, admins manage members and content, editors collaborate on prompts, and viewers have read-only access.
                </p>
                <ul className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2">
                  <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-semibold">Owner</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Full control over the team including transfers and deletion.
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-semibold">Admin</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage prompts and members but cannot transfer ownership.
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-semibold">Editor</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create and edit prompts, but cannot manage members.
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="font-semibold">Viewer</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Read-only access to shared prompts.
                    </p>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        ) : null}
      </div>

      <Toast
        open={Boolean(toast)}
        title={toast?.title ?? ""}
        description={toast?.description}
        tone={toast?.tone}
        onClose={() => setToast(null)}
      />

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        message={upgradeMessage}
      />

      {editOpen && team ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <form
            onSubmit={handleUpdateTeam}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Edit team
            </h2>
            <div className="mt-4 grid gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Name
                </span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={120}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-500 dark:focus-visible:ring-violet-500"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Description
                </span>
                <textarea
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  rows={3}
                  maxLength={280}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-500 dark:focus-visible:ring-violet-500"
                />
              </label>
              {editError ? (
                <p className="text-xs text-rose-500" role="alert">
                  {editError}
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-violet-500"
              >
                {editLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
