from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models import DocumentType, MatchType, SourceFormat


class LineItem(BaseModel):
    sku: str | None = None
    description: str | None = None
    quantity: float | int | None = None
    unit_price: float | None = None
    currency: str | None = None


class ExtractedFields(BaseModel):
    vendor_name: str | None = None
    line_items: list[LineItem] = Field(default_factory=list)
    total_amount: float | None = None
    currency: str | None = None
    lead_time_days: int | None = None
    payment_terms: str | None = None
    validity_date: str | None = None


class ExtractionResult(BaseModel):
    fields: ExtractedFields
    model_name: str
    latency_ms: int
    cost_usd: float
    run_id: str


class FieldScoreOut(BaseModel):
    id: str
    field_name: str
    score: float
    match_type: MatchType
    notes: str | None = None

    model_config = {"from_attributes": True}


class ExtractionRunOut(BaseModel):
    id: str
    document_id: str
    model_name: str
    extracted_value: dict[str, Any]
    latency_ms: int
    cost_usd: float
    created_at: datetime
    field_scores: list[FieldScoreOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class GroundTruthOut(BaseModel):
    id: str
    field_name: str
    expected_value: Any
    is_required: bool

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: str
    filename: str
    doc_type: DocumentType
    source_format: SourceFormat
    created_at: datetime
    latest_score: float | None = None
    latest_run_id: str | None = None

    model_config = {"from_attributes": True}


class DocumentDetailOut(DocumentOut):
    raw_content: str
    ground_truths: list[GroundTruthOut]
    extraction_runs: list[ExtractionRunOut]


class RunsByDocumentOut(BaseModel):
    document_id: str
    filename: str
    runs: list[ExtractionRunOut]


class RunAllSummaryOut(BaseModel):
    total_documents: int
    runs_created: int
    average_score: float | None
    results: list[ExtractionRunOut]
