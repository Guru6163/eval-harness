from __future__ import annotations

import os
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

import uuid

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import Document, ExtractionRun, GroundTruth, Prompt
from app.schema import ensure_schema
from app.schemas import (
    ComparisonDocumentOut,
    ComparisonFieldOut,
    ComparisonOut,
    DocumentDetailOut,
    DocumentOut,
    ExtractionRunOut,
    PromptCreate,
    PromptOut,
    PromptSummaryOut,
    RunAllStartOut,
    RunAllSummaryOut,
    RunProgressOut,
    RescoreOut,
    RunsByDocumentOut,
    FieldDebugOut,
)
from app.extraction import _resolve_prompt
from app.run_jobs import mark_run_all_started, run_all_started_at
from app.scoring import SCORED_FIELD_NAMES
from app.services import (
    average_field_score,
    debug_field,
    execute_run_all,
    load_run,
    rescore_all_runs,
    run_extraction_and_scoring,
)

app = FastAPI(title="ExtractBench API")


@app.on_event("startup")
def _apply_schema_updates() -> None:
    ensure_schema()


_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
# Vercel and Railway preview/production frontends (override via CORS_ORIGIN_REGEX).
_cors_origin_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"https://.*\.(vercel\.app|up\.railway\.app)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db)) -> list[DocumentOut]:
    documents = db.scalars(
        select(Document).order_by(Document.created_at.desc())
    ).all()
    results: list[DocumentOut] = []

    for doc in documents:
        latest_run = db.scalar(
            select(ExtractionRun)
            .where(ExtractionRun.document_id == doc.id)
            .options(selectinload(ExtractionRun.field_scores))
            .order_by(ExtractionRun.created_at.desc())
            .limit(1)
        )
        results.append(
            DocumentOut(
                id=doc.id,
                filename=doc.filename,
                doc_type=doc.doc_type,
                source_format=doc.source_format,
                created_at=doc.created_at,
                latest_score=average_field_score(latest_run) if latest_run else None,
                latest_run_id=latest_run.id if latest_run else None,
            )
        )
    return results


@app.get("/api/documents/{document_id}", response_model=DocumentDetailOut)
def get_document(document_id: str, db: Session = Depends(get_db)) -> DocumentDetailOut:
    doc = db.scalar(
        select(Document)
        .where(Document.id == document_id)
        .options(
            selectinload(Document.ground_truths),
            selectinload(Document.extraction_runs).selectinload(
                ExtractionRun.field_scores
            ),
        )
    )
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    runs = sorted(doc.extraction_runs, key=lambda r: r.created_at, reverse=True)
    latest_run = runs[0] if runs else None

    return DocumentDetailOut(
        id=doc.id,
        filename=doc.filename,
        doc_type=doc.doc_type,
        source_format=doc.source_format,
        created_at=doc.created_at,
        raw_content=doc.raw_content,
        latest_score=average_field_score(latest_run) if latest_run else None,
        latest_run_id=latest_run.id if latest_run else None,
        ground_truths=doc.ground_truths,
        extraction_runs=runs,
    )


@app.get("/api/runs", response_model=list[RunsByDocumentOut])
def list_runs(db: Session = Depends(get_db)) -> list[RunsByDocumentOut]:
    documents = db.scalars(select(Document)).all()
    grouped: list[RunsByDocumentOut] = []

    for doc in documents:
        runs = list(
            db.scalars(
                select(ExtractionRun)
                .where(ExtractionRun.document_id == doc.id)
                .options(selectinload(ExtractionRun.field_scores))
                .order_by(ExtractionRun.created_at.desc())
            ).all()
        )
        if not runs:
            continue
        grouped.append(
            RunsByDocumentOut(
                document_id=doc.id,
                filename=doc.filename,
                runs=[ExtractionRunOut.model_validate(r) for r in runs],
            )
        )

    grouped.sort(
        key=lambda g: g.runs[0].created_at if g.runs else g.document_id,
        reverse=True,
    )
    return grouped


@app.get("/api/runs/progress/{prompt_id}", response_model=RunProgressOut)
def run_progress(prompt_id: str, db: Session = Depends(get_db)) -> RunProgressOut:
    if db.get(Prompt, prompt_id) is None:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_id}")

    total = db.scalar(select(func.count()).select_from(Document)) or 0
    started_ts = run_all_started_at(prompt_id)
    if started_ts is not None:
        since = datetime.fromtimestamp(started_ts, tz=timezone.utc)
        completed = (
            db.scalar(
                select(func.count(func.distinct(ExtractionRun.document_id)))
                .where(ExtractionRun.prompt_id == prompt_id)
                .where(ExtractionRun.created_at >= since)
            )
            or 0
        )
    else:
        completed = (
            db.scalar(
                select(func.count(func.distinct(ExtractionRun.document_id))).where(
                    ExtractionRun.prompt_id == prompt_id
                )
            )
            or 0
        )
    status = "done" if total > 0 and completed >= total else "running"
    return RunProgressOut(completed=completed, total=total, status=status)


@app.post("/api/runs/rescore", response_model=RescoreOut)
def rescore_runs(db: Session = Depends(get_db)) -> RescoreOut:
    if db.scalar(select(func.count()).select_from(ExtractionRun)) == 0:
        raise HTTPException(status_code=400, detail="No extraction runs to rescore")
    return rescore_all_runs(db)


@app.post("/api/runs/run-all", response_model=RunAllStartOut)
def run_all(
    background_tasks: BackgroundTasks,
    prompt_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> RunAllStartOut:
    try:
        resolved_id, _ = _resolve_prompt(db, prompt_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    mark_run_all_started(resolved_id)
    background_tasks.add_task(execute_run_all, resolved_id)
    return RunAllStartOut(status="started", prompt_id=resolved_id)


@app.post("/api/runs/{document_id}", response_model=ExtractionRunOut)
def create_run(
    document_id: str, db: Session = Depends(get_db)
) -> ExtractionRunOut:
    try:
        return run_extraction_and_scoring(db, document_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/prompts", response_model=list[PromptOut])
def list_prompts(db: Session = Depends(get_db)) -> list[PromptOut]:
    prompts = db.scalars(select(Prompt).order_by(Prompt.created_at.desc())).all()
    return [PromptOut.model_validate(p) for p in prompts]


@app.post("/api/prompts", response_model=PromptOut)
def create_prompt(
    payload: PromptCreate, db: Session = Depends(get_db)
) -> PromptOut:
    prompt = Prompt(
        id=str(uuid.uuid4()),
        name=payload.name,
        content=payload.content,
        is_active=False,
    )
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    return PromptOut.model_validate(prompt)


@app.get("/api/prompts/active", response_model=PromptOut)
def get_active_prompt(db: Session = Depends(get_db)) -> PromptOut:
    prompt = db.scalar(select(Prompt).where(Prompt.is_active.is_(True)))
    if prompt is None:
        raise HTTPException(status_code=404, detail="No active prompt configured")
    return PromptOut.model_validate(prompt)


@app.put("/api/prompts/{prompt_id}/activate", response_model=PromptOut)
def activate_prompt(prompt_id: str, db: Session = Depends(get_db)) -> PromptOut:
    prompt = db.get(Prompt, prompt_id)
    if prompt is None:
        raise HTTPException(status_code=404, detail="Prompt not found")

    db.execute(
        update(Prompt)
        .where(Prompt.id != prompt_id)
        .values(is_active=False)
    )
    prompt.is_active = True
    db.commit()
    db.refresh(prompt)
    return PromptOut.model_validate(prompt)


def _latest_run_per_document(
    db: Session, prompt_id: str
) -> dict[str, ExtractionRun]:
    runs = db.scalars(
        select(ExtractionRun)
        .where(ExtractionRun.prompt_id == prompt_id)
        .options(selectinload(ExtractionRun.field_scores))
        .order_by(ExtractionRun.created_at.desc())
    ).all()
    latest: dict[str, ExtractionRun] = {}
    for run in runs:
        latest.setdefault(run.document_id, run)
    return latest


def _prompt_summary(
    prompt: Prompt,
    runs_by_document: dict[str, ExtractionRun],
    document_ids: list[str],
) -> PromptSummaryOut:
    scored: list[float] = []
    for doc_id in document_ids:
        run = runs_by_document.get(doc_id)
        if run is None:
            continue
        avg = average_field_score(run)
        if avg is not None:
            scored.append(avg)
    overall = sum(scored) / len(scored) if scored else None
    return PromptSummaryOut(
        id=prompt.id,
        name=prompt.name,
        is_active=prompt.is_active,
        overall_accuracy=overall,
        document_count=len(document_ids),
    )


@app.get("/api/debug/field/{field_name}", response_model=FieldDebugOut)
def debug_field_scores(
    field_name: str,
    prompt_id: str = Query(...),
    db: Session = Depends(get_db),
) -> FieldDebugOut:
    try:
        return debug_field(db, field_name, prompt_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/comparison", response_model=ComparisonOut)
def comparison(
    prompt_a: str = Query(...),
    prompt_b: str = Query(...),
    db: Session = Depends(get_db),
) -> ComparisonOut:
    p_a = db.get(Prompt, prompt_a)
    p_b = db.get(Prompt, prompt_b)
    if p_a is None:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_a}")
    if p_b is None:
        raise HTTPException(status_code=404, detail=f"Prompt not found: {prompt_b}")

    runs_a_count = (
        db.scalar(
            select(func.count())
            .select_from(ExtractionRun)
            .where(ExtractionRun.prompt_id == prompt_a)
        )
        or 0
    )
    runs_b_count = (
        db.scalar(
            select(func.count())
            .select_from(ExtractionRun)
            .where(ExtractionRun.prompt_id == prompt_b)
        )
        or 0
    )
    if runs_a_count == 0 or runs_b_count == 0:
        raise HTTPException(
            status_code=400,
            detail="Run both prompts before comparing",
        )

    runs_a = _latest_run_per_document(db, prompt_a)
    runs_b = _latest_run_per_document(db, prompt_b)
    shared_doc_ids = sorted(set(runs_a.keys()) & set(runs_b.keys()))

    documents_by_id = {
        d.id: d
        for d in db.scalars(
            select(Document).where(Document.id.in_(shared_doc_ids))
        ).all()
    }

    field_scores: list[ComparisonFieldOut] = []
    for field_name in SCORED_FIELD_NAMES:
        scores_a: list[float] = []
        scores_b: list[float] = []
        for doc_id in shared_doc_ids:
            for fs in runs_a[doc_id].field_scores:
                if fs.field_name == field_name:
                    scores_a.append(fs.score)
                    break
            for fs in runs_b[doc_id].field_scores:
                if fs.field_name == field_name:
                    scores_b.append(fs.score)
                    break
        acc_a = sum(scores_a) / len(scores_a) if scores_a else None
        acc_b = sum(scores_b) / len(scores_b) if scores_b else None
        delta = (
            acc_b - acc_a if acc_a is not None and acc_b is not None else None
        )
        field_scores.append(
            ComparisonFieldOut(
                field_name=field_name,
                accuracy_a=acc_a,
                accuracy_b=acc_b,
                delta=delta,
            )
        )

    document_rows: list[ComparisonDocumentOut] = []
    for doc_id in shared_doc_ids:
        doc = documents_by_id.get(doc_id)
        score_a = average_field_score(runs_a[doc_id])
        score_b = average_field_score(runs_b[doc_id])
        delta = (
            score_b - score_a
            if score_a is not None and score_b is not None
            else None
        )
        document_rows.append(
            ComparisonDocumentOut(
                document_id=doc_id,
                filename=doc.filename if doc else doc_id,
                score_a=score_a,
                score_b=score_b,
                delta=delta,
            )
        )

    summary_a = _prompt_summary(p_a, runs_a, shared_doc_ids)
    summary_b = _prompt_summary(p_b, runs_b, shared_doc_ids)
    overall_delta = (
        summary_b.overall_accuracy - summary_a.overall_accuracy
        if summary_a.overall_accuracy is not None
        and summary_b.overall_accuracy is not None
        else None
    )

    return ComparisonOut(
        prompt_a=summary_a,
        prompt_b=summary_b,
        overall_accuracy_a=summary_a.overall_accuracy,
        overall_accuracy_b=summary_b.overall_accuracy,
        overall_delta=overall_delta,
        fields=field_scores,
        documents=document_rows,
    )
