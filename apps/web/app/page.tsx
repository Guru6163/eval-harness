import { AboutDemoPanel } from "@/components/dashboard/about-demo";
import { AnimatedHero } from "@/components/dashboard/animated-hero";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { GridBackground } from "@/components/dashboard/grid-background";
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
      <div className="relative">
        <GridBackground />
        <main className="mx-auto max-w-6xl px-6 pb-40 md:px-8">
          <AnimatedHero
            overallAccuracy={data.overallAccuracy}
            documentsEvaluated={data.documentsEvaluated}
            totalDocuments={totalDocuments}
            fieldsScored={data.fieldsScored || totalDocuments * 7}
            avgLatencySec={data.avgLatencySec}
            error={error}
          />
          <TypeAccuracySection items={data.byDocType} />
          <DocumentsTable documents={data.documents} />
          <AboutDemoPanel />
        </main>
      </div>
    </>
  );
}
