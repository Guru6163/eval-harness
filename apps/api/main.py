from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import get_db
from app.models import Document, ExtractionRun, GroundTruth
from app.schemas import (
    DocumentDetailOut,
    DocumentOut,
    ExtractionRunOut,
    RunAllSummaryOut,
    RunsByDocumentOut,
)
from app.services import average_field_score, load_run, run_extraction_and_scoring

app = FastAPI(title="ExtractBench API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
            .options(joinedload(ExtractionRun.field_scores))
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
            joinedload(Document.ground_truths),
            joinedload(Document.extraction_runs).joinedload(ExtractionRun.field_scores),
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
                .options(joinedload(ExtractionRun.field_scores))
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


@app.post("/api/runs/run-all", response_model=RunAllSummaryOut)
def run_all(db: Session = Depends(get_db)) -> RunAllSummaryOut:
    documents = list(db.scalars(select(Document)).all())
    results: list[ExtractionRunOut] = []
    score_sum = 0.0
    scored_count = 0

    for doc in documents:
        try:
            run_out = run_extraction_and_scoring(db, doc.id)
            results.append(run_out)
            if run_out.field_scores:
                avg = sum(s.score for s in run_out.field_scores) / len(
                    run_out.field_scores
                )
                score_sum += avg
                scored_count += 1
        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Failed on document {doc.id}: {exc}",
            ) from exc

    return RunAllSummaryOut(
        total_documents=len(documents),
        runs_created=len(results),
        average_score=score_sum / scored_count if scored_count else None,
        results=results,
    )
