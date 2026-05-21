"use client";

import { useEffect, useState } from "react";

import { AboutDemoPanel } from "@/components/dashboard/about-demo";
import { AnimatedHero } from "@/components/dashboard/animated-hero";
import { DocumentsTable } from "@/components/dashboard/documents-table";
import { TypeAccuracySection } from "@/components/dashboard/type-accuracy";
import { PageLoading, PageShell } from "@/components/page-shell";
import {
  type DashboardData,
  type DocTypeAccuracy,
  getDashboardData,
} from "@/lib/api";

const EMPTY_BY_DOC_TYPE: DocTypeAccuracy[] = [
  {
    key: "supplier_quote",
    label: "Supplier Quote",
    index: "01",
    accuracyPercent: null,
  },
  {
    key: "customer_request",
    label: "Customer Request",
    index: "02",
    accuracyPercent: null,
  },
  {
    key: "purchase_order",
    label: "Purchase Order",
    index: "03",
    accuracyPercent: null,
  },
];

const EMPTY_DASHBOARD: DashboardData = {
  overallAccuracy: null,
  documentsEvaluated: 0,
  fieldsScored: 0,
  avgLatencySec: null,
  byDocType: EMPTY_BY_DOC_TYPE,
  documents: [],
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDashboardData()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
          setData(EMPTY_DASHBOARD);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return <PageLoading message="Loading dashboard…" />;
  }

  const totalDocuments = data.documents.length || 12;

  return (
    <PageShell>
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
    </PageShell>
  );
}
