"use client";

import { TeamPlanSummary } from "@/types/team";

type PlanUsageMeterProps = {
  plan: TeamPlanSummary;
  label?: string;
  className?: string;
};

export function PlanUsageMeter({ plan, label, className }: PlanUsageMeterProps) {
  const limit = plan.memberLimit;
  const used = plan.usedSeats;
  const percentage =
    limit && limit > 0 ? Math.min((used / limit) * 100, 100) : used > 0 ? 100 : 0;
  const remaining =
    limit && limit > 0 ? Math.max(limit - used, 0) : null;

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
        <span className="uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-500">
          {label ?? "Members"}
        </span>
        <span>
          {limit && limit > 0 ? (
            <>
              {used} / {limit} members
            </>
          ) : (
            <>{used} members</>
          )}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={
            "h-full transition-all " +
            (plan.memberLimitReached
              ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500"
              : "bg-violet-500")
          }
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />
      </div>
      {limit && limit > 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {remaining && remaining > 0
            ? `${remaining} seat${remaining === 1 ? "" : "s"} remaining`
            : "No seats remaining"}
        </p>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Unlimited members available
        </p>
      )}
    </div>
  );
}
