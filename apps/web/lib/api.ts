import { FIELD_LABELS, SCORED_FIELDS } from "@/lib/fields";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://eval-harness-production.up.railway.app";

const FIELDS_PER_DOCUMENT = 7;

export type DocType =
  | "supplier_quote"
  | "customer_request"
  | "purchase_order";

export type SourceFormat =
  | "native_pdf"
  | "scanned_pdf"
  | "email_body"
  | "spreadsheet";

export interface Document {
  id: string;
  filename: string;
  doc_type: DocType;
  source_format: SourceFormat;
  created_at: string;
  latest_score: number | null;
  latest_run_id: string | null;
}

export type MatchType = "exact" | "partial" | "missing" | "wrong";

export interface FieldScore {
  id: string;
  field_name: string;
  score: number;
  match_type: MatchType;
  notes: string | null;
}

export interface GroundTruth {
  id: string;
  field_name: string;
  expected_value: unknown;
  is_required: boolean;
}

export interface ExtractionRun {
  id: string;
  document_id: string;
  prompt_id: string | null;
  model_name: string;
  extracted_value: Record<string, unknown>;
  latency_ms: number;
  cost_usd: number;
  created_at: string;
  field_scores: FieldScore[];
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

export interface DocumentDetail extends Document {
  raw_content: string;
  ground_truths: GroundTruth[];
  extraction_runs: ExtractionRun[];
  notes?: string | null;
}

export interface FieldAccuracy {
  field: string;
  label: string;
  accuracyPercent: number | null;
}

export interface RunsByDocument {
  document_id: string;
  filename: string;
  runs: ExtractionRun[];
}

export type DocumentStatus = "Pass" | "Partial" | "Fail" | "Pending";

export interface DocumentRow extends Document {
  accuracyPercent: number | null;
  status: DocumentStatus;
  latencyMs: number | null;
}

export interface DocTypeAccuracy {
  key: DocType;
  label: string;
  index: string;
  accuracyPercent: number | null;
}

export interface DashboardData {
  overallAccuracy: number | null;
  documentsEvaluated: number;
  fieldsScored: number;
  avgLatencySec: number | null;
  byDocType: DocTypeAccuracy[];
  documents: DocumentRow[];
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  if (!res.ok) {
    let detail = String(res.status);
    try {
      const body = (await res.json()) as { detail?: string };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(`API ${path} failed: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export function getDocuments(): Promise<Document[]> {
  return fetchJson<Document[]>("/api/documents");
}

export function getRuns(): Promise<RunsByDocument[]> {
  return fetchJson<RunsByDocument[]>("/api/runs");
}

export function getDocument(id: string): Promise<DocumentDetail> {
  return fetchJson<DocumentDetail>(`/api/documents/${id}`);
}

export function getPrompts(): Promise<Prompt[]> {
  return fetchJson<Prompt[]>("/api/prompts");
}

export async function getActivePrompt(): Promise<Prompt | null> {
  const res = await fetch(`${API_URL}/api/prompts/active`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`API /api/prompts/active failed: ${res.status}`);
  }
  return (await res.json()) as Prompt;
}

export function createPrompt(payload: {
  name: string;
  content: string;
}): Promise<Prompt> {
  return fetchJson<Prompt>("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function activatePrompt(promptId: string): Promise<Prompt> {
  return fetchJson<Prompt>(`/api/prompts/${promptId}/activate`, {
    method: "PUT",
  });
}

export interface RunAllStart {
  status: string;
  prompt_id: string;
}

export interface RunProgress {
  completed: number;
  total: number;
  status: "running" | "done";
}

export function triggerRunAll(promptId?: string): Promise<RunAllStart> {
  const qs = promptId ? `?prompt_id=${encodeURIComponent(promptId)}` : "";
  return fetchJson<RunAllStart>(`/api/runs/run-all${qs}`, { method: "POST" });
}

export function getRunProgress(promptId: string): Promise<RunProgress> {
  return fetchJson<RunProgress>(`/api/runs/progress/${promptId}`);
}

export interface PromptSummary {
  id: string;
  name: string;
  is_active: boolean;
  overall_accuracy: number | null;
  document_count: number;
}

export interface ComparisonField {
  field_name: string;
  accuracy_a: number | null;
  accuracy_b: number | null;
  delta: number | null;
}

export interface ComparisonDocument {
  document_id: string;
  filename: string;
  score_a: number | null;
  score_b: number | null;
  delta: number | null;
}

export interface Comparison {
  prompt_a: PromptSummary;
  prompt_b: PromptSummary;
  overall_accuracy_a: number | null;
  overall_accuracy_b: number | null;
  overall_delta: number | null;
  fields: ComparisonField[];
  documents: ComparisonDocument[];
}

export function getComparison(
  promptA: string,
  promptB: string
): Promise<Comparison> {
  const qs = new URLSearchParams({ prompt_a: promptA, prompt_b: promptB });
  return fetchJson<Comparison>(`/api/comparison?${qs}`);
}

export async function getFieldAccuracy(): Promise<FieldAccuracy[]> {
  const runsGrouped = await getRuns();
  const buckets: Record<string, number[]> = {};

  for (const field of SCORED_FIELDS) {
    buckets[field] = [];
  }

  for (const group of runsGrouped) {
    const latest = group.runs[0];
    if (!latest) continue;
    for (const fs of latest.field_scores) {
      if (buckets[fs.field_name]) {
        buckets[fs.field_name].push(fs.score);
      }
    }
  }

  return SCORED_FIELDS.map((field) => {
    const scores = buckets[field];
    return {
      field,
      label: FIELD_LABELS[field],
      accuracyPercent:
        scores.length > 0
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 100
            )
          : null,
    };
  });
}

export function scoreToStatus(score: number | null): DocumentStatus {
  if (score === null) return "Pending";
  if (score >= 0.85) return "Pass";
  if (score >= 0.6) return "Partial";
  return "Fail";
}

export function formatDocType(docType: DocType): string {
  const labels: Record<DocType, string> = {
    supplier_quote: "Supplier Quote",
    customer_request: "Customer Request",
    purchase_order: "Purchase Order",
  };
  return labels[docType];
}

export function formatSourceFormat(format: SourceFormat): string {
  const labels: Record<SourceFormat, string> = {
    native_pdf: "Native PDF",
    scanned_pdf: "Scanned PDF",
    email_body: "Email",
    spreadsheet: "Spreadsheet",
  };
  return labels[format];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [documents, runsGrouped] = await Promise.all([
    getDocuments(),
    getRuns(),
  ]);

  const latencyByDoc = new Map<string, number>();
  for (const group of runsGrouped) {
    const latest = group.runs[0];
    if (latest) {
      latencyByDoc.set(group.document_id, latest.latency_ms);
    }
  }

  const evaluated = documents.filter((d) => d.latest_run_id);
  const scores = evaluated
    .map((d) => d.latest_score)
    .filter((s): s is number => s !== null);

  const overallAccuracy =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
      : null;

  const latencies = evaluated
    .map((d) => latencyByDoc.get(d.id))
    .filter((ms): ms is number => ms !== undefined);

  const avgLatencySec =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length / 1000
      : null;

  const docTypes: { key: DocType; label: string; index: string }[] = [
    { key: "supplier_quote", label: "Supplier Quote", index: "01" },
    { key: "customer_request", label: "Customer Request", index: "02" },
    { key: "purchase_order", label: "Purchase Order", index: "03" },
  ];

  const byDocType: DocTypeAccuracy[] = docTypes.map(({ key, label, index }) => {
    const typeDocs = evaluated.filter((d) => d.doc_type === key);
    const typeScores = typeDocs
      .map((d) => d.latest_score)
      .filter((s): s is number => s !== null);
    return {
      key,
      label,
      index,
      accuracyPercent:
        typeScores.length > 0
          ? Math.round(
              (typeScores.reduce((a, b) => a + b, 0) / typeScores.length) * 100
            )
          : null,
    };
  });

  const documentsWithMeta: DocumentRow[] = documents.map((doc) => ({
    ...doc,
    accuracyPercent:
      doc.latest_score !== null
        ? Math.round(doc.latest_score * 100)
        : null,
    status: scoreToStatus(doc.latest_score),
    latencyMs: latencyByDoc.get(doc.id) ?? null,
  }));

  return {
    overallAccuracy,
    documentsEvaluated: evaluated.length,
    fieldsScored: evaluated.length * FIELDS_PER_DOCUMENT,
    avgLatencySec,
    byDocType,
    documents: documentsWithMeta,
  };
}
