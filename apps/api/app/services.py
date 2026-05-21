from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.extraction import extract_document
from app.models import Document, ExtractionRun, FieldScore, GroundTruth
from app.scoring import score_extraction
from app.schemas import ExtractionRunOut


def average_field_score(run: ExtractionRun) -> float | None:
    if not run.field_scores:
        return None
    return sum(s.score for s in run.field_scores) / len(run.field_scores)


def load_run(db: Session, run_id: str) -> ExtractionRun | None:
    return db.scalar(
        select(ExtractionRun)
        .where(ExtractionRun.id == run_id)
        .options(joinedload(ExtractionRun.field_scores))
    )


def run_extraction_and_scoring(db: Session, document_id: str) -> ExtractionRunOut:
    doc = db.get(Document, document_id)
    if doc is None:
        raise ValueError(f"Document not found: {document_id}")

    result = extract_document(doc, db=db)
    run = db.get(ExtractionRun, result.run_id)
    if run is None:
        raise RuntimeError("Extraction run was not persisted")

    truths = list(
        db.scalars(
            select(GroundTruth).where(GroundTruth.document_id == document_id)
        ).all()
    )
    score_extraction(run, truths, db=db)
    db.commit()

    loaded = load_run(db, run.id)
    assert loaded is not None
    return ExtractionRunOut.model_validate(loaded)
