from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.extraction import extract_document
from app.models import Document, ExtractionRun, FieldScore, GroundTruth, Prompt
from app.scoring import (
    SCORED_FIELD_NAMES,
    _match_type,
    _score_field,
    score_extraction,
)
from app.schemas import (
    ExtractionRunOut,
    FieldDebugOut,
    FieldDebugRow,
    PromptAccuracySummary,
    RescoreOut,
)


def average_field_score(run: ExtractionRun) -> float | None:
    if not run.field_scores:
        return None
    return sum(s.score for s in run.field_scores) / len(run.field_scores)


def load_run(db: Session, run_id: str) -> ExtractionRun | None:
    return db.scalar(
        select(ExtractionRun)
        .where(ExtractionRun.id == run_id)
        .options(selectinload(ExtractionRun.field_scores))
    )


def run_extraction_and_scoring(
    db: Session, document_id: str, prompt_id: str | None = None
) -> ExtractionRunOut:
    doc = db.get(Document, document_id)
    if doc is None:
        raise ValueError(f"Document not found: {document_id}")

    result = extract_document(doc, db=db, prompt_id=prompt_id)
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


def execute_run_all(prompt_id: str | None) -> None:
    """Run extraction + scoring for every document (background job)."""
    from app.db import SessionLocal
    from app.extraction import _resolve_prompt
    from app.run_jobs import clear_run_all

    db = SessionLocal()
    resolved_id: str | None = None
    try:
        resolved_id, _ = _resolve_prompt(db, prompt_id)
        documents = list(db.scalars(select(Document)).all())
        for doc in documents:
            try:
                run_extraction_and_scoring(db, doc.id, prompt_id=resolved_id)
            except Exception:
                db.rollback()
                raise
    finally:
        if resolved_id is not None:
            clear_run_all(resolved_id)
        db.close()


def rescore_all_runs(db: Session) -> RescoreOut:
    """Re-score every extraction run without calling OpenAI."""
    runs = list(
        db.scalars(
            select(ExtractionRun).options(selectinload(ExtractionRun.field_scores))
        ).all()
    )
    prompt_names: dict[str | None, str] = {
        p.id: p.name for p in db.scalars(select(Prompt)).all()
    }
    prompt_names[None] = "(no prompt)"

    totals: dict[str | None, list[float]] = {}
    counts: dict[str | None, int] = {}

    for run in runs:
        truths = list(
            db.scalars(
                select(GroundTruth).where(GroundTruth.document_id == run.document_id)
            ).all()
        )
        score_extraction(run, truths, db=db, replace_existing=True)
        refreshed = load_run(db, run.id)
        avg = average_field_score(refreshed) if refreshed else None
        pid = run.prompt_id
        counts[pid] = counts.get(pid, 0) + 1
        if avg is not None:
            totals.setdefault(pid, []).append(avg)

    db.commit()

    by_prompt = [
        PromptAccuracySummary(
            prompt_id=pid,
            prompt_name=prompt_names.get(pid, str(pid)),
            runs_rescored=counts[pid],
            overall_accuracy=(
                sum(scores) / len(scores) if (scores := totals.get(pid)) else None
            ),
        )
        for pid in sorted(counts.keys(), key=lambda x: (x is None, str(x)))
    ]

    return RescoreOut(runs_rescored=len(runs), by_prompt=by_prompt)


def debug_field(
    db: Session, field_name: str, prompt_id: str
) -> FieldDebugOut:
    if field_name not in SCORED_FIELD_NAMES:
        raise ValueError(f"Unknown field: {field_name}")

    prompt = db.get(Prompt, prompt_id)
    if prompt is None:
        raise ValueError(f"Prompt not found: {prompt_id}")

    documents = list(db.scalars(select(Document)).all())
    runs = list(
        db.scalars(
            select(ExtractionRun)
            .where(ExtractionRun.prompt_id == prompt_id)
            .order_by(ExtractionRun.created_at.desc())
        ).all()
    )
    latest_by_doc: dict[str, ExtractionRun] = {}
    for run in runs:
        latest_by_doc.setdefault(run.document_id, run)

    rows: list[FieldDebugRow] = []
    for doc in documents:
        run = latest_by_doc.get(doc.id)
        gt = db.scalar(
            select(GroundTruth).where(
                GroundTruth.document_id == doc.id,
                GroundTruth.field_name == field_name,
            )
        )
        expected = gt.expected_value if gt else None
        extracted = (
            (run.extracted_value or {}).get(field_name) if run is not None else None
        )
        score_val, notes = _score_field(field_name, expected, extracted)
        rows.append(
            FieldDebugRow(
                document_id=doc.id,
                filename=doc.filename,
                expected=expected,
                extracted=extracted,
                score=score_val,
                match_type=_match_type(score_val, expected, extracted),
                notes=notes,
            )
        )

    return FieldDebugOut(
        field_name=field_name,
        prompt_id=prompt_id,
        prompt_name=prompt.name,
        rows=rows,
    )
