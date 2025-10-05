import { type CSSProperties } from "react";

import { formatSnippet, formatUpdatedAt } from "@/lib/format";
import { PromptWithTags } from "@/types/prompt";

const snippetStyle: CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

type PromptCardProps = {
  prompt: PromptWithTags;
};

export function PromptCard({ prompt }: PromptCardProps) {
  const tags = prompt.tags.map(({ tag }) => tag.name.toLowerCase());

  return (
    <article
      className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:border-violet-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/40 dark:hover:border-violet-500/60"
      aria-label={prompt.title}
    >
      <div className="flex flex-col gap-3">
        <header className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 transition-colors dark:text-slate-100">
            {prompt.title}
          </h3>
          <time
            dateTime={prompt.updatedAt}
            className="whitespace-nowrap text-xs font-medium text-slate-500 transition-colors dark:text-slate-400"
          >
            {formatUpdatedAt(prompt.updatedAt)}
          </time>
        </header>
        <p
          className="text-sm text-slate-600 transition-colors dark:text-slate-300"
          style={snippetStyle}
        >
          {formatSnippet(prompt.body)}
        </p>
      </div>
      {tags.length ? (
        <footer className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-violet-100/80 px-3 py-1 text-xs font-medium lowercase text-violet-700 transition group-hover:bg-violet-200/90 dark:bg-violet-500/10 dark:text-violet-200 dark:group-hover:bg-violet-500/20"
            >
              {tag}
            </span>
          ))}
        </footer>
      ) : null}
    </article>
  );
}
