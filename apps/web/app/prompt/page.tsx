"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { GridBackground } from "@/components/dashboard/grid-background";
import { SiteNav } from "@/components/site-nav";
import {
  type Comparison,
  type Prompt,
  type RunsByDocument,
  createPrompt,
  getComparison,
  getPrompts,
  getRunProgress,
  getRuns,
  triggerRunAll,
} from "@/lib/api";
import {
  COMPARISON_FIELD_ORDER,
  buildComparisonSummary,
  fieldLabel,
  formatAccuracyPercent,
  formatDelta,
} from "@/lib/comparison";

const DOCUMENT_PLACEHOLDER = "{document_content}";
const POLL_MS = 2000;

function formatCreated(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date}, ${time}`;
}

function promptOverallAccuracy(
  promptId: string,
  runsByDoc: RunsByDocument[]
): number | null {
  const scores: number[] = [];
  for (const group of runsByDoc) {
    const run = group.runs.find((r) => r.prompt_id === promptId);
    if (!run?.field_scores.length) continue;
    const avg =
      run.field_scores.reduce((a, b) => a + b.score, 0) /
      run.field_scores.length;
    scores.push(avg);
  }
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function ChangeCell({ delta }: { delta: number | null }) {
  const { text, variant } = formatDelta(delta);
  if (variant === "none") {
    return <span className="text-muted">{text}</span>;
  }
  const color = variant === "up" ? "text-pass" : "text-fail";
  const arrow = variant === "up" ? "↑" : "↓";
  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${color}`}
      style={{ color: variant === "up" ? "#15803D" : "#B91C1C" }}
    >
      <span className="text-[10px] leading-none">{arrow}</span>
      {text}
    </span>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <p className="text-xs font-medium tracking-wider text-muted uppercase">
      Section · {index} — {title}
    </p>
  );
}

export default function PromptPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [runsByDoc, setRunsByDoc] = useState<RunsByDocument[]>([]);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [runningId, setRunningId] = useState<string | null>(null);
  const [runProgress, setRunProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);

  const [promptAId, setPromptAId] = useState("");
  const [promptBId, setPromptBId] = useState("");
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  const refreshData = useCallback(async () => {
    const [allPrompts, runs] = await Promise.all([
      getPrompts(),
      getRuns().catch(() => [] as RunsByDocument[]),
    ]);
    setPrompts(allPrompts);
    setRunsByDoc(runs);
    return allPrompts;
  }, []);

  useEffect(() => {
    refreshData().catch(() => {});
  }, [refreshData]);

  useEffect(() => {
    if (prompts.length >= 2 && !promptAId && !promptBId) {
      setPromptAId(prompts[0].id);
      setPromptBId(prompts[1].id);
    } else if (prompts.length === 1 && !promptAId) {
      setPromptAId(prompts[0].id);
      setPromptBId(prompts[0].id);
    }
  }, [prompts, promptAId, promptBId]);

  const accuracyByPrompt = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const p of prompts) {
      map.set(p.id, promptOverallAccuracy(p.id, runsByDoc));
    }
    return map;
  }, [prompts, runsByDoc]);

  const handleSave = async () => {
    setSaveError(null);
    if (!name.trim()) {
      setSaveError("Enter a prompt name.");
      return;
    }
    if (!content.includes(DOCUMENT_PLACEHOLDER)) {
      setSaveError(`Prompt content must include ${DOCUMENT_PLACEHOLDER}.`);
      return;
    }
    setSaving(true);
    try {
      await createPrompt({ name: name.trim(), content });
      setName("");
      setContent("");
      await refreshData();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  const pollUntilDone = useCallback(
    async (promptId: string) => {
      const tick = async () => {
        const p = await getRunProgress(promptId);
        setRunProgress({ completed: p.completed, total: p.total });
        if (p.status === "done") {
          setRunningId(null);
          setRunProgress(null);
          await refreshData();
          return true;
        }
        return false;
      };
      if (await tick()) return;
      const id = window.setInterval(async () => {
        try {
          if (await tick()) window.clearInterval(id);
        } catch {
          window.clearInterval(id);
          setRunningId(null);
          setRunProgress(null);
        }
      }, POLL_MS);
    },
    [refreshData]
  );

  const handleRun = async (promptId: string) => {
    setRunningId(promptId);
    setRunProgress({ completed: 0, total: 18 });
    try {
      await triggerRunAll(promptId);
      await pollUntilDone(promptId);
    } catch (e) {
      setRunningId(null);
      setRunProgress(null);
    }
  };

  const handleCompare = async () => {
    setCompareError(null);
    setComparison(null);
    if (!promptAId || !promptBId) {
      setCompareError("Select two prompts.");
      return;
    }
    if (promptAId === promptBId) {
      setCompareError("Choose two different prompts.");
      return;
    }
    setComparing(true);
    try {
      const result = await getComparison(promptAId, promptBId);
      setComparison(result);
    } catch (e) {
      setCompareError(e instanceof Error ? e.message : "Comparison failed");
    } finally {
      setComparing(false);
    }
  };

  const fieldByName = comparison
    ? new Map(comparison.fields.map((f) => [f.field_name, f]))
    : null;

  return (
    <>
      <SiteNav />
      <div className="relative">
        <GridBackground />
        <main className="mx-auto max-w-5xl bg-cream px-8 py-24">
          <header className="mb-16">
            <p className="text-xs font-medium tracking-wider text-muted uppercase">
              Prompt
            </p>
            <h1 className="mt-4 text-4xl font-medium tracking-tight text-ink md:text-5xl">
              Prompt editor
            </h1>
          </header>

          {/* Section 1 */}
          <section className="border-t border-border pt-10">
            <SectionLabel index="01" title="Add a prompt" />
            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="sr-only">Prompt name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Baseline v1, With examples v2"
                  className="w-full border border-border bg-cream px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="sr-only">Prompt content</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your prompt here. Use {document_content} where the document should be inserted."
                  spellCheck={false}
                  className="min-h-64 w-full resize-y border border-border bg-cream px-4 py-4 font-mono text-sm leading-relaxed text-ink outline-none focus:border-accent"
                />
              </label>
              {saveError && (
                <p className="text-sm text-fail">{saveError}</p>
              )}
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save prompt"}
              </button>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mt-16 border-t border-border pt-10">
            <SectionLabel index="02" title="Saved prompts" />
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xs font-medium tracking-wider text-muted uppercase">
                      Name
                    </th>
                    <th className="pb-3 text-left text-xs font-medium tracking-wider text-muted uppercase">
                      Created
                    </th>
                    <th className="pb-3 text-right text-xs font-medium tracking-wider text-muted uppercase">
                      Accuracy
                    </th>
                    <th className="pb-3 text-right text-xs font-medium tracking-wider text-muted uppercase">
                      Run
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-sm text-muted"
                      >
                        No prompts saved yet.
                      </td>
                    </tr>
                  )}
                  {prompts.map((p) => {
                    const acc = accuracyByPrompt.get(p.id);
                    const isRunning = runningId === p.id;
                    const showProgress =
                      isRunning && runProgress !== null;
                    return (
                      <tr key={p.id} className="border-b border-border">
                        <td className="py-4 pr-4 text-ink">{p.name}</td>
                        <td className="py-4 pr-4 text-muted">
                          {formatCreated(p.created_at)}
                        </td>
                        <td className="py-4 pr-4 text-right tabular-nums font-medium text-ink">
                          {acc !== null && acc !== undefined ? (
                            `${Math.round(acc * 100)}%`
                          ) : (
                            <span className="font-normal text-muted">—</span>
                          )}
                        </td>
                        <td className="py-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() => void handleRun(p.id)}
                            disabled={runningId !== null}
                            className="inline-flex items-center gap-2 rounded border border-border px-3 py-1 text-sm text-ink transition-colors hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRunning && (
                              <span
                                className="inline-block h-3 w-3 animate-spin rounded-full border border-border border-t-accent"
                                aria-hidden
                              />
                            )}
                            {isRunning ? "Running…" : "▶ Run"}
                          </button>
                          {showProgress && (
                            <p className="mt-2 text-xs text-muted">
                              Running… ({runProgress.completed}/
                              {runProgress.total})
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mt-16 border-t border-border pt-10">
            <SectionLabel index="03" title="Compare two prompts" />
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium tracking-wider text-muted uppercase">
                  Prompt A
                </span>
                <select
                  value={promptAId}
                  onChange={(e) => setPromptAId(e.target.value)}
                  className="border border-border bg-cream px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5">
                <span className="text-xs font-medium tracking-wider text-muted uppercase">
                  Prompt B
                </span>
                <select
                  value={promptBId}
                  onChange={(e) => setPromptBId(e.target.value)}
                  className="border border-border bg-cream px-3 py-2.5 text-sm text-ink outline-none focus:border-accent"
                >
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void handleCompare()}
                disabled={comparing || prompts.length < 2}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {comparing ? "Comparing…" : "Compare"}
              </button>
            </div>

            {compareError && (
              <p className="mt-4 text-sm text-fail">{compareError}</p>
            )}

            {comparison && fieldByName && (
              <div className="mt-10">
                <table className="w-full min-w-[32rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left text-xs font-medium tracking-wider text-muted uppercase">
                        Field
                      </th>
                      <th className="pb-3 text-right text-xs font-medium tracking-wider text-muted uppercase">
                        {comparison.prompt_a.name}
                      </th>
                      <th className="pb-3 text-right text-xs font-medium tracking-wider text-muted uppercase">
                        {comparison.prompt_b.name}
                      </th>
                      <th className="pb-3 text-right text-xs font-medium tracking-wider text-muted uppercase">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FIELD_ORDER.map((fieldName) => {
                      const row = fieldByName.get(fieldName);
                      return (
                        <tr
                          key={fieldName}
                          className="border-b border-border"
                        >
                          <td className="py-3 text-ink">
                            {fieldLabel(fieldName)}
                          </td>
                          <td className="py-3 text-right tabular-nums text-ink">
                            {formatAccuracyPercent(row?.accuracy_a ?? null)}
                          </td>
                          <td className="py-3 text-right tabular-nums text-ink">
                            {formatAccuracyPercent(row?.accuracy_b ?? null)}
                          </td>
                          <td className="py-3 text-right">
                            <ChangeCell delta={row?.delta ?? null} />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-b border-border">
                      <td className="py-3 font-medium text-ink">Overall</td>
                      <td className="py-3 text-right font-medium tabular-nums text-ink">
                        {formatAccuracyPercent(
                          comparison.overall_accuracy_a
                        )}
                      </td>
                      <td className="py-3 text-right font-medium tabular-nums text-ink">
                        {formatAccuracyPercent(
                          comparison.overall_accuracy_b
                        )}
                      </td>
                      <td className="py-3 text-right font-medium">
                        <ChangeCell delta={comparison.overall_delta} />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-6 text-sm text-muted italic">
                  {buildComparisonSummary(comparison)}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
