import { FieldBars } from "@/components/analysis/field-bars";
import { SiteNav } from "@/components/site-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type FieldAccuracy, getFieldAccuracy } from "@/lib/api";

const FAILURE_MODES = [
  {
    mode: "Scanned PDF OCR errors",
    count: 8,
    example: "8/8 misread — totals and SKUs drift from ground truth",
  },
  {
    mode: "Multi-tier pricing collapsed to single price",
    count: 3,
    example: "EUR Tier 2 (18 units) merged into one unit_price",
  },
  {
    mode: "Currency assumed USD when EUR",
    count: 2,
    example: "Meridian EU quote returned USD in extraction",
  },
  {
    mode: "Lead time absent in source — model hallucinated",
    count: 4,
    example: "Scanned valve quote with illegible lead time filled as 14d",
  },
  {
    mode: "Ambiguous SKU references (“the usual”)",
    count: 5,
    example: "Forwarded email RFQ — line_items missing HF-CB-38",
  },
  {
    mode: "Price buried in prose",
    count: 3,
    example: "Lumber scan: unit prices inferred wrong from ~47.25/ea text",
  },
];

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  let fieldAccuracy: FieldAccuracy[] = [];
  try {
    fieldAccuracy = await getFieldAccuracy();
  } catch {
    // API unavailable — show empty bars
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-8 py-24 pb-32">
        <p className="text-xs font-medium tracking-widest text-muted uppercase">
          Analysis
        </p>
        <h1 className="mt-6 text-5xl font-medium tracking-tight text-ink">
          Where extraction breaks down
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Field-level accuracy and recurring failure patterns across the
          evaluation corpus.
        </p>

        <section className="mt-20 border-t border-border pt-20">
          <h2 className="text-sm font-medium tracking-wide text-ink">
            Accuracy by field
          </h2>
          <FieldBars items={fieldAccuracy} />
        </section>

        <section className="mt-20 border-t border-border pt-20">
          <h2 className="text-sm font-medium tracking-wide text-ink">
            Failure modes
          </h2>
          <Table className="mt-10">
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead>Failure mode</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Example</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FAILURE_MODES.map((row) => (
                <TableRow
                  key={row.mode}
                  className="border-b border-border hover:bg-transparent"
                >
                  <TableCell className="text-ink">{row.mode}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted">
                    {row.count}
                  </TableCell>
                  <TableCell className="text-muted">{row.example}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="mt-20 border-t border-border pt-20">
          <h2 className="text-2xl font-medium tracking-tight text-ink">
            What I would build next
          </h2>
          {/* EDIT BEFORE SENDING */}
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-ink/90">
            <p>
              [Placeholder — describe the highest-leverage product follow-up.
              Example: a human-in-the-loop review queue for partial extractions,
              with one-click accept/reject per field and automatic re-prompting
              on failure clusters.]
            </p>
            <p>
              [Placeholder — technical direction. Example: fine-tuned smaller
              models per document type, with Sonnet reserved for low-confidence
              fields only; cache OCR layers for scanned PDFs.]
            </p>
            <p>
              [Placeholder — evaluation expansion. Example: add layout-aware
              PDF parsing, multilingual quotes, and attachment-heavy email
              threads; score calibration curves by format not just aggregate %.]
            </p>
            <p>
              [Placeholder — closing note on why this harness matters for your
              roadmap and what metric would gate a production rollout.]
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
