import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type DocumentRow,
  type DocumentStatus,
  formatDocType,
  formatSourceFormat,
} from "@/lib/api";

function StatusPill({ status }: { status: DocumentStatus }) {
  const className =
    status === "Pass"
      ? "text-accent"
      : status === "Partial"
        ? "text-partial"
        : status === "Fail"
          ? "text-fail"
          : "text-muted";

  return (
    <span className={`text-xs font-medium tracking-wide ${className}`}>
      {status}
    </span>
  );
}

interface DocumentsTableProps {
  documents: DocumentRow[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  return (
    <section id="documents" className="border-t border-border py-20">
      <h2 className="text-sm font-medium tracking-wide text-ink">
        All documents
      </h2>
      <Table className="mt-10">
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead>Document</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Format</TableHead>
            <TableHead className="text-right">Accuracy</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow
              key={doc.id}
              className="group border-b border-border hover:bg-transparent"
            >
              <TableCell>
                <Link
                  href={`/documents/${doc.id}`}
                  className="text-ink/80 transition-colors group-hover:text-ink"
                >
                  {doc.filename}
                </Link>
              </TableCell>
              <TableCell className="text-muted">
                {formatDocType(doc.doc_type)}
              </TableCell>
              <TableCell className="text-muted">
                {formatSourceFormat(doc.source_format)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-ink">
                {doc.accuracyPercent !== null
                  ? `${doc.accuracyPercent}%`
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <StatusPill status={doc.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
