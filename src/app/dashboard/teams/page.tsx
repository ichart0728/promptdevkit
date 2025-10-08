"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PlanUsageMeter } from "@/components/teams/PlanUsageMeter";
import { Toast } from "@/components/teams/Toast";
import { UpgradeModal } from "@/components/teams/UpgradeModal";
import {
  createTeam,
  getTeams,
} from "@/lib/api";
import {
  FREE_PLAN_MEMBER_LIMIT,
  FREE_PLAN_TEAM_LIMIT,
} from "@/lib/plan-constants";
import { TeamSummary } from "@/types/team";

const hasLimit = (limit: number) => Number.isFinite(limit) && limit > 0;

type FetchError = Error & { status?: number };

const isFetchError = (error: unknown): error is FetchError =>
  typeof error === "object" && error !== null && "status" in error;

const teamLimitActive = hasLimit(FREE_PLAN_TEAM_LIMIT);
const memberLimitActive = hasLimit(FREE_PLAN_MEMBER_LIMIT);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function TeamsOverviewPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    tone?: "success" | "error" | "info";
  } | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTeams();
      const sorted = [...result].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setTeams(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const teamLimitReached = useMemo(
    () =>
      teamLimitActive && teams.length >= FREE_PLAN_TEAM_LIMIT,
    [teams.length]
  );

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creating || teamLimitReached) return;

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      setFormError("Team name is required.");
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      const team = await createTeam({
        name: trimmedName,
        description: trimmedDescription ? trimmedDescription : undefined,
      });
      setTeams((current) =>
        [...current.filter((item) => item.id !== team.id), team].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        )
      );
      setName("");
      setDescription("");
      setToast({
        title: "Team created",
        description: `${team.name} is ready to share prompts.`,
        tone: "success",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create team.";
      setFormError(message);
      if (isFetchError(err) && err.status === 403) {
        setUpgradeMessage(message);
        setUpgradeOpen(true);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleManageTeam = (teamId: string) => {
    router.push(`/dashboard/teams/${teamId}`);
  };

  const handleViewPrompts = (team: TeamSummary) => {
    const params = new URLSearchParams();
    params.set("teamId", team.id);
    if (team.name) {
      params.set("teamName", team.name);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  const memberLimitSummary = memberLimitActive
    ? `Free plan supports up to ${FREE_PLAN_MEMBER_LIMIT} members per team.`
    : "Unlimited members on this plan.";

  const teamLimitSummary = teamLimitActive
    ? `Free plan supports up to ${FREE_PLAN_TEAM_LIMIT} team${
        FREE_PLAN_TEAM_LIMIT === 1 ? "" : "s"
      }.`
    : "Unlimited teams on this plan.";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Teams
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Collaborate with teammates, manage access, and stay within your plan limits.
              </p>
            </div>
            <div className="flex flex-col items-end text-sm text-slate-500 dark:text-slate-400">
              {teamLimitActive ? (
                <span>
                  {teams.length} / {FREE_PLAN_TEAM_LIMIT} teams
                </span>
              ) : (
                <span>{teams.length} teams</span>
              )}
              <span>{teamLimitSummary}</span>
            </div>
          </div>

          <form
            className="mt-6 grid gap-4 rounded-2xl border border-slate-200 p-4 shadow-inner dark:border-slate-800"
            onSubmit={handleCreateTeam}
          >
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Team name
                </span>
                <input
                  type="text"
                  maxLength={120}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setFormError(null);
                  }}
                  disabled={creating || teamLimitReached}
                  placeholder="Product design guild"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-500 dark:focus-visible:ring-violet-500"
                  aria-label="Team name"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Description (optional)
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={creating || teamLimitReached}
                  maxLength={280}
                  rows={2}
                  placeholder="Describe this team's purpose"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-violet-500 dark:focus-visible:ring-violet-500"
                  aria-label="Team description"
                />
              </label>
            </div>
            {formError ? (
              <p className="text-xs text-rose-500" role="alert">
                {formError}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {memberLimitSummary}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={creating || teamLimitReached}
                className="inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-violet-500 dark:hover:bg-violet-400 dark:focus-visible:ring-violet-500"
              >
                {creating ? "Creating…" : "Create team"}
              </button>
              {teamLimitReached ? (
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="text-xs font-semibold uppercase tracking-wide text-violet-600 underline decoration-dotted dark:text-violet-300"
                >
                  Upgrade to add more teams
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading teams…
            </div>
          ) : error ? (
            <div className="flex flex-col gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadTeams}
                className="self-start rounded-lg border border-rose-300 bg-white/80 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-100"
              >
                Retry
              </button>
            </div>
          ) : teams.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              <p className="font-medium">No teams yet</p>
              <p className="mt-1 text-xs">
                Create a team to invite collaborators and share prompts.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {teams.map((team) => (
                <article
                  key={team.id}
                  className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {team.name}
                      </h2>
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200">
                        {team.plan.type === "paid" ? "Pro" : "Free"}
                      </span>
                    </div>
                    {team.description ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {team.description}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        No description provided.
                      </p>
                    )}
                    <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        <dt className="uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Created
                        </dt>
                        <dd>{dateFormatter.format(new Date(team.createdAt))}</dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Owner
                        </dt>
                        <dd>
                          {team.owner?.name ?? team.owner?.email ?? "Unassigned"}
                        </dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Members
                        </dt>
                        <dd>
                          {team.metrics.memberCount}
                          {memberLimitActive
                            ? ` / ${FREE_PLAN_MEMBER_LIMIT}`
                            : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          Pending invites
                        </dt>
                        <dd>{team.metrics.pendingInviteCount}</dd>
                      </div>
                    </dl>
                    <PlanUsageMeter plan={team.plan} className="mt-2" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => handleViewPrompts(team)}
                      className="inline-flex items-center justify-center rounded-xl border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-violet-500/40 dark:bg-violet-500/10 dark:text-violet-200 dark:hover:bg-violet-500/20"
                      aria-label={`View prompts for ${team.name}`}
                    >
                      View prompts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManageTeam(team.id)}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                      aria-label={`Manage ${team.name}`}
                    >
                      Manage team
                    </button>
                    <Link
                      href="/docs/permissions"
                      className="text-xs text-slate-500 underline decoration-dotted hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Review permissions
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
    </main>
  );
}
