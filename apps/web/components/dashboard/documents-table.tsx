"use client";

import { ArrowRight, FileText, Mail, FileSpreadsheet, ScanLine } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

import {
  AnimatedNumber,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/lib/motion";
import {
  type DocumentRow,
  type DocumentStatus,
  type SourceFormat,
  formatDocType,
  formatSourceFormat,
} from "@/lib/api";

function StatusPill({ status }: { status: DocumentStatus }) {
  const colorClass =
    status === "Pass"
      ? "text-accent"
      : status === "Partial"
        ? "text-partial"
        : status === "Fail"
          ? "text-fail"
          : "text-muted";

  const dotClass =
    status === "Pass"
      ? "bg-accent"
      : status === "Partial"
        ? "bg-partial"
        : status === "Fail"
          ? "bg-fail"
          : "bg-muted";

  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-medium tracking-wide ${colorClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
}

function FormatIcon({ format }: { format: SourceFormat }) {
  const icons: Record<SourceFormat, React.ReactNode> = {
    native_pdf: <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />,
    scanned_pdf: <ScanLine className="h-3.5 w-3.5" strokeWidth={1.5} />,
    email_body: <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />,
    spreadsheet: <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.5} />,
  };
  return icons[format];
}

interface DocumentsTableProps {
  documents: DocumentRow[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  return (
    <section id="documents" className="border-t border-border py-24">
      <Reveal className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs tracking-widest text-muted uppercase">
            Section · 02
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight text-ink md:text-3xl">
            All documents
          </h2>
        </div>
        <p className="hidden text-sm text-muted sm:block">
          {documents.length} total
        </p>
      </Reveal>

      <div className="mt-12 overflow-x-auto">
        <Stagger stagger={0.04} className="min-w-full">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-6 border-b border-border pb-3 text-xs tracking-wide text-muted uppercase">
            <span>Document</span>
            <span>Type</span>
            <span>Format</span>
            <span className="text-right">Accuracy</span>
            <span className="text-right">Status</span>
          </div>
          {documents.map((doc) => (
            <StaggerItem key={doc.id}>
              <Link
                href={`/documents/${doc.id}`}
                className="group relative grid grid-cols-[1.5fr_1fr_1fr_auto_auto] items-center gap-6 border-b border-border py-5 transition-colors"
              >
                <motion.span
                  layoutId={`accent-${doc.id}`}
                  className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 origin-center scale-y-0 bg-accent transition-transform duration-300 group-hover:scale-y-100"
                />
                <div className="flex items-center gap-3 pl-4 transition-transform duration-300 group-hover:translate-x-1">
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {String(documents.indexOf(doc) + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-sm text-ink/85 transition-colors group-hover:text-ink">
                    {doc.filename}
                  </span>
                </div>
                <span className="text-sm text-muted">
                  {formatDocType(doc.doc_type)}
                </span>
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <FormatIcon format={doc.source_format} />
                  {formatSourceFormat(doc.source_format)}
                </span>
                <span className="text-right text-sm tabular-nums text-ink">
                  {doc.accuracyPercent !== null ? (
                    <>
                      <AnimatedNumber value={doc.accuracyPercent} />%
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="flex items-center justify-end gap-3 text-right">
                  <StatusPill status={doc.status} />
                  <ArrowRight
                    className="h-3.5 w-3.5 translate-x-0 text-muted opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                    strokeWidth={1.5}
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
