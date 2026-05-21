export function AboutDemoPanel() {
  return (
    <section className="mt-20 border-t border-border pt-20">
      <div className="border border-border p-6">
        <h2 className="text-sm font-medium tracking-wide text-ink">
          About this demo
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          The eighteen documents in this corpus are entirely synthetic. They
          mirror common patterns from B2B procurement workflows—supplier quotes,
          inbound RFQs, and follow-up POs across PDF, email, and spreadsheet
          formats—but contain no real customer data.
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
          Each document is scored against hand-authored ground truth for seven
          fields. Extraction uses GPT-4o with a fixed JSON schema;
          accuracy is computed with deterministic rules (exact match, fuzzy
          strings, tolerance bands) so results are reproducible. Run{" "}
          <code className="font-mono text-xs text-ink">
            ./scripts/run_eval.sh
          </code>{" "}
          locally to seed the database and evaluate all documents in one pass.
        </p>
      </div>
    </section>
  );
}
