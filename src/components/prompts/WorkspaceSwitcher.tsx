"use client";

import { WorkspaceType } from "@/types/workspace";

type WorkspaceSwitcherProps = {
  value: WorkspaceType;
  onChange: (value: WorkspaceType) => void;
  teamDisabled?: boolean;
  teamDisabledReason?: string;
};

const options: Array<{ value: WorkspaceType; label: string }> = [
  { value: "personal", label: "個人用" },
  { value: "team", label: "チーム用" },
];

export function WorkspaceSwitcher({
  value,
  onChange,
  teamDisabled,
  teamDisabledReason,
}: WorkspaceSwitcherProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 p-1 text-xs font-medium shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      {options.map((option) => {
        const isActive = value === option.value;
        const disabled = option.value === "team" ? teamDisabled : false;
        const title = disabled ? teamDisabledReason : undefined;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (disabled) return;
              onChange(option.value);
            }}
            disabled={disabled}
            title={title}
            className={`rounded-full px-3 py-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 dark:focus-visible:ring-violet-500/60 ${
              isActive
                ? "bg-violet-500 text-white shadow"
                : "text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-300"
            } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
