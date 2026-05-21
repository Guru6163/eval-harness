"use client";

import { useCallback, useEffect, useState } from "react";

import { ComparisonChart } from "@/components/analysis/comparison-chart";
import { ComparisonTable } from "@/components/analysis/comparison-table";
import {
  type Comparison,
  type Document,
  type Prompt,
  getComparison,
  getDocuments,
  getPrompts,
} from "@/lib/api";

const selectClass =
  "w-full min-w-[12rem] rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30";

interface PromptComparisonPanelProps {
  /** Pre-select prompt ids (e.g. from URL on /comparison). */
  initialPromptAId?: string;
  initialPromptBId?: string;
  /** Auto-run compare on mount when both ids are set. */
  autoCompare?: boolean;
}

export function PromptComparisonPanel({
  initialPromptAId,
  initialPromptBId,
  autoCompare = false,
}: PromptComparisonPanelProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptAId, setPromptAId] = useState(initialPromptAId ?? "");
  const [promptBId, setPromptBId] = useState(initialPromptBId ?? "");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [allPrompts, docs] = await Promise.all([
          getPrompts(),
          getDocuments().catch(() => [] as Document[]),
        ]);
        if (cancelled) return;
        setPrompts(allPrompts);
        setDocuments(docs);
        if (!initialPromptAId && allPrompts.length >= 1) {
          setPromptAId((prev) => prev || allPrompts[0].id);
        }
        if (!initialPromptBId && allPrompts.length >= 2) {
          setPromptBId((prev) => prev || allPrompts[1].id);
        } else if (!initialPromptBId && allPrompts.length === 1) {
          setPromptBId((prev) => prev || allPrompts[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof Error ? e.message : "Failed to load prompts"
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPromptAId, initialPromptBId]);

  const runCompare = useCallback(async () => {
    if (!promptAId || !promptBId) {
      setError("Select both prompts to compare.");
      return;
    }
    if (promptAId === promptBId) {
      setError("Choose two different prompts.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [result, docs] = await Promise.all([
        getComparison(promptAId, promptBId),
        getDocuments().catch(() => documents),
      ]);
      setComparison(result);
      setDocuments(docs);
    } catch (e) {
      setComparison(null);
      setError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }, [promptAId, promptBId, documents]);

  useEffect(() => {
    if (
      !autoCompare ||
      !initialPromptAId ||
      !initialPromptBId ||
      initialPromptAId === initialPromptBId
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const [result, docs] = await Promise.all([
          getComparison(initialPromptAId, initialPromptBId),
          getDocuments().catch(() => [] as Document[]),
        ]);
        if (cancelled) return;
        setComparison(result);
        setDocuments(docs);
        setPromptAId(initialPromptAId);
        setPromptBId(initialPromptBId);
      } catch (e) {
        if (!cancelled) {
          setComparison(null);
          setError(e instanceof Error ? e.message : "Comparison failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoCompare, initialPromptAId, initialPromptBId]);

  const sharedDocs =
    comparison?.prompt_a.document_count ?? comparison?.documents.length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium tracking-widest text-muted uppercase">
            Prompt A
          </span>
          <select
            value={promptAId}
            onChange={(e) => setPromptAId(e.target.value)}
            className={selectClass}
            disabled={loading || prompts.length === 0}
          >
            {prompts.length === 0 && (
              <option value="">No prompts available</option>
            )}
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.is_active ? " (active)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium tracking-widest text-muted uppercase">
            Prompt B
          </span>
          <select
            value={promptBId}
            onChange={(e) => setPromptBId(e.target.value)}
            className={selectClass}
            disabled={loading || prompts.length === 0}
          >
            {prompts.length === 0 && (
              <option value="">No prompts available</option>
            )}
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.is_active ? " (active)" : ""}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void runCompare()}
          disabled={loading || prompts.length < 2}
          className="inline-flex h-[42px] items-center justify-center rounded-lg bg-accent px-6 text-sm font-medium text-cream transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>

      {(loadError || error) && (
        <p className="mt-4 text-sm text-fail">{loadError ?? error}</p>
      )}

      {comparison && !loading && (
        <div className="mt-10">
          <p className="mb-6 text-sm text-muted">
            {sharedDocs} document{sharedDocs === 1 ? "" : "s"} with runs for
            both prompts.
          </p>
          <ComparisonTable comparison={comparison} />
          <ComparisonChart comparison={comparison} documents={documents} />
        </div>
      )}

      {!comparison && !loading && !error && !loadError && (
        <p className="mt-8 text-sm text-muted">
          Select two prompts and click Compare to see field-level accuracy.
        </p>
      )}
    </div>
  );
}
