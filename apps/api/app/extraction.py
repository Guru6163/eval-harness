from __future__ import annotations

import json
import re
import time
import uuid
from typing import TYPE_CHECKING

from anthropic import Anthropic
from pydantic import ValidationError

from app.db import SessionLocal
from app.models import Document, ExtractionRun
from app.schemas import ExtractedFields, ExtractionResult

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

MODEL_NAME = "claude-sonnet-4-20250514"

# Claude Sonnet pricing (USD per million tokens)
INPUT_COST_PER_MTOK = 3.0
OUTPUT_COST_PER_MTOK = 15.0

SYSTEM_PROMPT = """You extract structured procurement fields from messy business documents.
Return ONLY a single JSON object with no markdown fences and no commentary.
The JSON must match this schema exactly:
{
  "vendor_name": string or null,
  "line_items": [
    {
      "sku": string or null,
      "description": string or null,
      "quantity": number or null,
      "unit_price": number or null,
      "currency": string or null
    }
  ],
  "total_amount": number or null,
  "currency": string or null,
  "lead_time_days": integer or null,
  "payment_terms": string or null,
  "validity_date": string or null
}
Use null for unknown fields. Use ISO date YYYY-MM-DD for validity_date when possible."""

USER_PROMPT_TEMPLATE = """Extract fields from this document.

Filename: {filename}
Type: {doc_type}
Format: {source_format}

--- DOCUMENT ---
{raw_content}
--- END ---"""


def _estimate_cost_usd(input_tokens: int, output_tokens: int) -> float:
    return (input_tokens / 1_000_000) * INPUT_COST_PER_MTOK + (
        output_tokens / 1_000_000
    ) * OUTPUT_COST_PER_MTOK


def _user_message(doc: Document) -> str:
    return USER_PROMPT_TEMPLATE.format(
        filename=doc.filename,
        doc_type=doc.doc_type.value,
        source_format=doc.source_format.value,
        raw_content=doc.raw_content,
    )


def _parse_json_payload(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _extract_with_instructor(
    client: Anthropic, doc: Document
) -> tuple[ExtractedFields, int, int]:
    import instructor

    patched = instructor.from_anthropic(client)
    fields, completion = patched.messages.create_with_completion(
        model=MODEL_NAME,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _user_message(doc)}],
        response_model=ExtractedFields,
    )
    usage = completion.usage
    return fields, usage.input_tokens, usage.output_tokens


def _extract_with_manual_json(
    client: Anthropic, doc: Document
) -> tuple[ExtractedFields, int, int]:
    user_content = _user_message(doc)
    last_error: Exception | None = None

    for attempt in range(2):
        extra = ""
        if attempt == 1:
            extra = (
                "\n\nYour previous response was invalid. "
                "Reply with ONLY valid JSON matching the schema."
            )
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content + extra}],
        )
        text = "".join(
            block.text for block in response.content if block.type == "text"
        )
        try:
            payload = _parse_json_payload(text)
            fields = ExtractedFields.model_validate(payload)
            usage = response.usage
            return fields, usage.input_tokens, usage.output_tokens
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc

    raise ValueError(f"Failed to parse extraction JSON: {last_error}") from last_error


def _call_model(client: Anthropic, doc: Document) -> tuple[ExtractedFields, int, int]:
    try:
        import instructor  # noqa: F401

        return _extract_with_instructor(client, doc)
    except ImportError:
        return _extract_with_manual_json(client, doc)


def extract_document(
    doc: Document, db: Session | None = None
) -> ExtractionResult:
    """Run Claude extraction and persist an ExtractionRun row."""
    owns_session = db is None
    if owns_session:
        db = SessionLocal()

    assert db is not None
    client = Anthropic()
    started = time.perf_counter()
    fields, input_tokens, output_tokens = _call_model(client, doc)
    latency_ms = int((time.perf_counter() - started) * 1000)
    cost_usd = _estimate_cost_usd(input_tokens, output_tokens)

    run = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        model_name=MODEL_NAME,
        extracted_value=fields.model_dump(mode="json"),
        latency_ms=latency_ms,
        cost_usd=cost_usd,
    )
    db.add(run)
    db.flush()

    if owns_session:
        db.commit()
        db.close()

    return ExtractionResult(
        fields=fields,
        model_name=MODEL_NAME,
        latency_ms=latency_ms,
        cost_usd=cost_usd,
        run_id=run.id,
    )
