import { AboutDemoPanel } from "@/components/dashboard/about-demo";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { StatsRow } from "@/components/dashboard/stats-row";
import { TypeAccuracySection } from "@/components/dashboard/type-accuracy";
import { SiteNav } from "@/components/site-nav";
import { getDashboardData } from "@/lib/api";

export default async function Home() {
  let data;
  let error: string | null = null;

  try {
    data = await getDashboardData();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
    data = {
      overallAccuracy: null,
      documentsEvaluated: 0,
      fieldsScored: 0,
      avgLatencySec: null,
      byDocType: [
        {
          key: "supplier_quote" as const,
          label: "Supplier Quote",
          index: "01",
          accuracyPercent: null,
        },
        {
          key: "customer_request" as const,
          label: "Customer Request",
          index: "02",
          accuracyPercent: null,
        },
        {
          key: "purchase_order" as const,
          label: "Purchase Order",
          index: "03",
          accuracyPercent: null,
        },
      ],
      documents: [],
    };
  }

  const totalDocuments = data.documents.length || 18;

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-8 pb-32">
        <header className="py-24">
          <p className="text-xs font-medium tracking-widest text-muted uppercase">
            Evaluation harness
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-medium tracking-tight text-ink">
            Extraction accuracy across 18 documents
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted">
            Measures how reliably Claude extracts structured procurement fields
            from messy supplier quotes, customer requests, and purchase orders.
          </p>
          {error ? (
            <p className="mt-6 text-sm text-fail">
              API unavailable — start the backend at localhost:8000. ({error})
            </p>
          ) : null}
          <StatsRow
            overallAccuracy={data.overallAccuracy}
            documentsEvaluated={data.documentsEvaluated}
            totalDocuments={totalDocuments}
            fieldsScored={
              data.fieldsScored || totalDocuments * 7
            }
            avgLatencySec={data.avgLatencySec}
          />
        </header>

        <TypeAccuracySection items={data.byDocType} />
        <DocumentsTable documents={data.documents} />
        <AboutDemoPanel />
      </main>
    </>
  );
}
