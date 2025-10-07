"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pdk-theme";

type Theme = "light" | "dark";

const getPreferredTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
  }
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

export const SunIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.42 1.42" />
    <path d="m17.65 17.65 1.42 1.42" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.35 17.65-1.42 1.42" />
    <path d="m19.07 4.93-1.42 1.42" />
  </svg>
);

export const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = getPreferredTheme();
    applyTheme(stored);
    setTheme(stored);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized || typeof window === "undefined") return;
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, isInitialized]);

  const toggleTheme = () => {
    if (!isInitialized) return;
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      disabled={!isInitialized}
      aria-pressed={theme === "dark"}
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      className={`relative inline-flex h-7 w-12 items-center rounded-full border border-violet-300 bg-white/80 px-1 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-violet-400/60 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-500/50 dark:bg-slate-900/80 ${
        className ?? ""
      }`}
    >
      <span
        className={`pointer-events-none absolute inset-y-1 left-1 w-5 rounded-full bg-violet-500/80 shadow transition-transform duration-200 ease-out dark:bg-violet-400/80 ${
          theme === "dark" ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
