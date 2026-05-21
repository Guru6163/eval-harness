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
    prompt_id: str | None = None
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


class RunAllStartOut(BaseModel):
    status: str
    prompt_id: str


class RunProgressOut(BaseModel):
    completed: int
    total: int
    status: str


class PromptCreate(BaseModel):
    name: str
    content: str


class PromptOut(BaseModel):
    id: str
    name: str
    content: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PromptSummaryOut(BaseModel):
    id: str
    name: str
    is_active: bool
    overall_accuracy: float | None
    document_count: int


class ComparisonFieldOut(BaseModel):
    field_name: str
    accuracy_a: float | None
    accuracy_b: float | None
    delta: float | None


class ComparisonDocumentOut(BaseModel):
    document_id: str
    filename: str
    score_a: float | None
    score_b: float | None
    delta: float | None


class ComparisonOut(BaseModel):
    prompt_a: PromptSummaryOut
    prompt_b: PromptSummaryOut
    overall_accuracy_a: float | None
    overall_accuracy_b: float | None
    overall_delta: float | None
    fields: list[ComparisonFieldOut]
    documents: list[ComparisonDocumentOut]


class PromptAccuracySummary(BaseModel):
    prompt_id: str | None
    prompt_name: str
    runs_rescored: int
    overall_accuracy: float | None


class RescoreOut(BaseModel):
    runs_rescored: int
    by_prompt: list[PromptAccuracySummary]


class FieldDebugRow(BaseModel):
    document_id: str
    filename: str
    expected: Any
    extracted: Any
    score: float
    match_type: MatchType
    notes: str | None = None


class FieldDebugOut(BaseModel):
    field_name: str
    prompt_id: str
    prompt_name: str
    rows: list[FieldDebugRow]
