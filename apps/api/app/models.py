import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.types import JSON


class Base(DeclarativeBase):
    pass


class DocumentType(str, enum.Enum):
    supplier_quote = "supplier_quote"
    customer_request = "customer_request"
    purchase_order = "purchase_order"


class SourceFormat(str, enum.Enum):
    native_pdf = "native_pdf"
    scanned_pdf = "scanned_pdf"
    email_body = "email_body"
    spreadsheet = "spreadsheet"


class MatchType(str, enum.Enum):
    exact = "exact"
    partial = "partial"
    missing = "missing"
    wrong = "wrong"


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, native_enum=False), nullable=False
    )
    source_format: Mapped[SourceFormat] = mapped_column(
        Enum(SourceFormat, native_enum=False), nullable=False
    )
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    ground_truths: Mapped[list["GroundTruth"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    extraction_runs: Mapped[list["ExtractionRun"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class GroundTruth(Base):
    __tablename__ = "ground_truths"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(64), nullable=False)
    expected_value: Mapped[object] = mapped_column(JSON, nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    document: Mapped["Document"] = relationship(back_populates="ground_truths")


class ExtractionRun(Base):
    __tablename__ = "extraction_runs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    document_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("documents.id"), nullable=False
    )
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    extracted_value: Mapped[object] = mapped_column(JSON, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    document: Mapped["Document"] = relationship(back_populates="extraction_runs")
    field_scores: Mapped[list["FieldScore"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )


class FieldScore(Base):
    __tablename__ = "field_scores"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    run_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("extraction_runs.id"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(64), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    match_type: Mapped[MatchType] = mapped_column(
        Enum(MatchType, native_enum=False), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    run: Mapped["ExtractionRun"] = relationship(back_populates="field_scores")
