"use client";

import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MoonIcon, SunIcon, ThemeToggle } from "@/components/ui/ThemeToggle";

type AppShellProps = {
  children: ReactNode;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => ReactElement;
};

const navItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { label: "Team Management", href: "/team", icon: UsersIcon },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activePath = useMemo(() => pathname ?? "", [pathname]);

  const toggleSidebar = () => setSidebarOpen((current) => !current);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-slate-200 bg-white/80 px-5 py-6 shadow-xl transition-transform duration-300 ease-in-out backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:static lg:translate-x-0 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
            PromptDevKit
          </span>
          <button
            type="button"
            onClick={closeSidebar}
            className={classNames(
              "inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100",
              "focus:outline-none focus:ring-2 focus:ring-violet-400/60 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            )}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const isActive = activePath === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeSidebar}
                className={classNames(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white"
                )}
              >
                <item.icon
                  className={classNames(
                    "h-4 w-4 flex-shrink-0",
                    isActive
                      ? "text-violet-500"
                      : "text-slate-400 group-hover:text-violet-500 dark:text-slate-500"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          className={classNames(
            "mt-10 rounded-lg border border-slate-200 bg-white/70 p-4 text-xs text-slate-500 shadow-sm",
            "dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400"
          )}
        >
          <p className="font-semibold text-slate-600 dark:text-slate-200">
            Workspace tips
          </p>
          <p className="mt-2 leading-relaxed">
            Switch between workspaces to keep experiments organized and share
            context with your team.
          </p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Hide navigation"
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-sm transition-opacity lg:hidden"
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header
          className={classNames(
            "flex items-center justify-between gap-4 border-b border-slate-200 bg-white/70 px-6 py-4 shadow-sm",
            "transition-colors dark:border-slate-800 dark:bg-slate-900/70"
          )}
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className={classNames(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition",
                "hover:border-violet-300 hover:text-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60",
                "dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-violet-500/50 dark:hover:text-violet-300 lg:hidden"
              )}
              aria-label="Toggle navigation"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
            <SunIcon className="h-4 w-4" />
            <ThemeToggle className="h-6 w-10" />
            <MoonIcon className="h-4 w-4" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LayoutDashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h7v9H3z" />
      <path d="M14 3h7v5h-7z" />
      <path d="M14 12h7v9h-7z" />
      <path d="M3 16h7v5H3z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3.5" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
