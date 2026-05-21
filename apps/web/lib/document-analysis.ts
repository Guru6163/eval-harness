import type { FieldScore } from "@/lib/api";
import { DOCUMENT_NOTES } from "@/lib/document-notes";

export function resolveFailureAnalysis(
  documentId: string,
  documentNotes: string | null | undefined,
  fieldScores: FieldScore[]
): string {
  if (documentNotes?.trim()) {
    return documentNotes.trim();
  }
  if (DOCUMENT_NOTES[documentId]?.trim()) {
    return DOCUMENT_NOTES[documentId].trim();
  }

  const notes = fieldScores
    .filter((s) => s.score < 1 && s.notes?.trim())
    .map((s) => `${s.field_name.replace(/_/g, " ")}: ${s.notes}`)
    .join(" ");

  return notes || "No analysis available.";
}
