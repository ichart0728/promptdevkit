"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PromptWithTags } from "@/types/prompt";
import { extractVars } from "@/lib/template";
import { runPrompt } from "@/lib/api";

type RunPanelProps = {
  prompt: PromptWithTags | null;
};

type RunState = {
  result: string | null;
  error: string | null;
  loading: boolean;
};

const isRecordOfString = (value: unknown): value is Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
};

export function RunPanel({ prompt }: RunPanelProps) {
  const variableKeys = useMemo(() => {
    if (!prompt) return [] as string[];
    const fromBody = extractVars(prompt.body);
    if (fromBody.length > 0) {
      return fromBody;
    }
    if (isRecordOfString(prompt.variables)) {
      return Object.keys(prompt.variables);
    }
    return [];
  }, [prompt]);

  const [variables, setVariables] = useState<Record<string, string>>({});
  const [{ result, error, loading }, setRunState] = useState<RunState>({
    result: null,
    error: null,
    loading: false,
  });

  useEffect(() => {
    if (!prompt) {
      setVariables({});
      setRunState({ result: null, error: null, loading: false });
      return;
    }
    const initialValues = variableKeys.reduce<Record<string, string>>((acc, key) => {
      if (isRecordOfString(prompt.variables) && key in prompt.variables) {
        const value = prompt.variables[key];
        acc[key] = typeof value === "string" ? value : "";
      } else {
        acc[key] = "";
      }
      return acc;
    }, {});
    setVariables(initialValues);
    setRunState({ result: null, error: null, loading: false });
  }, [prompt, variableKeys]);

  const handleChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt) return;
    setRunState({ result: null, error: null, loading: true });
    try {
      const response = await runPrompt(prompt.id, variables);
      setRunState({ result: response.result, error: null, loading: false });
    } catch (err) {
      setRunState({
        result: null,
        error: err instanceof Error ? err.message : "Failed to run prompt.",
        loading: false,
      });
    }
  };

  if (!prompt) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        Select a prompt to run it.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Run Prompt</h2>
        <span className="text-xs text-gray-500">
          Updated {new Date(prompt.updatedAt).toLocaleString()}
        </span>
      </div>
      <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
        {prompt.body}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {variableKeys.length === 0 ? (
          <p className="text-sm text-gray-500">
            No variables detected. Running will send the prompt body as-is.
          </p>
        ) : (
          variableKeys.map((key) => (
            <div key={key} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900" htmlFor={`var-${key}`}>
                {key}
              </label>
              <input
                id={`var-${key}`}
                type="text"
                value={variables[key] ?? ""}
                onChange={(event) => handleChange(key, event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result !== null ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Result</h3>
          <pre className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            {result}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
