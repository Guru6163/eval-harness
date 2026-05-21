from __future__ import annotations

import json
import re
import time
import uuid
from typing import TYPE_CHECKING

from openai import OpenAI
from pydantic import ValidationError
from sqlalchemy import select

from app.db import SessionLocal
from app.models import Document, ExtractionRun, Prompt
from app.schemas import ExtractedFields, ExtractionResult

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

MODEL_NAME = "gpt-4o"

# GPT-4o pricing (USD per million tokens) — openai.com/api/pricing
INPUT_COST_PER_MTOK = 2.5
OUTPUT_COST_PER_MTOK = 10.0

DEFAULT_SYSTEM_PROMPT = """You extract structured procurement fields from messy business documents.
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
Use null for unknown fields. Use ISO date YYYY-MM-DD for validity_date when possible.

{document_content}"""

# Backwards-compatible alias for the in-code default prompt text.
SYSTEM_PROMPT = DEFAULT_SYSTEM_PROMPT

DOCUMENT_CONTENT_PLACEHOLDER = "{document_content}"

JSON_SCHEMA_SYSTEM = (
    "Return ONLY a single JSON object with no markdown fences and no commentary."
)

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


def document_content_block(doc: Document) -> str:
    return USER_PROMPT_TEMPLATE.format(
        filename=doc.filename,
        doc_type=doc.doc_type.value,
        source_format=doc.source_format.value,
        raw_content=doc.raw_content,
    )


def render_prompt_content(content: str, doc: Document) -> str:
    return content.replace(
        DOCUMENT_CONTENT_PLACEHOLDER, document_content_block(doc)
    )


def _parse_json_payload(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def _messages(
    doc: Document, prompt_content: str, extra: str = ""
) -> list[dict[str, str]]:
    rendered = render_prompt_content(prompt_content, doc) + extra
    return [
        {"role": "system", "content": JSON_SCHEMA_SYSTEM},
        {"role": "user", "content": rendered},
    ]


def _extract_with_instructor(
    client: OpenAI, doc: Document, prompt_content: str
) -> tuple[ExtractedFields, int, int]:
    import instructor

    patched = instructor.from_openai(client)
    fields, completion = patched.chat.completions.create_with_completion(
        model=MODEL_NAME,
        messages=_messages(doc, prompt_content),
        response_model=ExtractedFields,
    )
    usage = completion.usage
    assert usage is not None
    return fields, usage.prompt_tokens, usage.completion_tokens


def _extract_with_manual_json(
    client: OpenAI, doc: Document, prompt_content: str
) -> tuple[ExtractedFields, int, int]:
    last_error: Exception | None = None

    for attempt in range(2):
        extra = ""
        if attempt == 1:
            extra = (
                "\n\nYour previous response was invalid. "
                "Reply with ONLY valid JSON matching the schema."
            )
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=_messages(doc, prompt_content, extra),
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or ""
        try:
            payload = _parse_json_payload(text)
            fields = ExtractedFields.model_validate(payload)
            usage = response.usage
            assert usage is not None
            return fields, usage.prompt_tokens, usage.completion_tokens
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc

    raise ValueError(f"Failed to parse extraction JSON: {last_error}") from last_error


def _call_model(
    client: OpenAI, doc: Document, prompt_content: str
) -> tuple[ExtractedFields, int, int]:
    try:
        import instructor  # noqa: F401

        return _extract_with_instructor(client, doc, prompt_content)
    except ImportError:
        return _extract_with_manual_json(client, doc, prompt_content)


def _resolve_prompt(
    db: Session, prompt_id: str | None
) -> tuple[str | None, str]:
    """Return (prompt_id, prompt_content) to use for this extraction.

    If no prompt_id is given, uses the earliest prompt in the DB by created_at.
    """
    if prompt_id is not None:
        prompt = db.get(Prompt, prompt_id)
        if prompt is None:
            raise ValueError(f"Prompt not found: {prompt_id}")
        return prompt.id, prompt.content

    first = db.scalar(select(Prompt).order_by(Prompt.created_at.asc()).limit(1))
    if first is not None:
        return first.id, first.content

    return None, DEFAULT_SYSTEM_PROMPT


def extract_document(
    doc: Document,
    db: Session | None = None,
    prompt_id: str | None = None,
) -> ExtractionResult:
    """Run OpenAI extraction and persist an ExtractionRun row.

    If ``prompt_id`` is supplied, that prompt is loaded from the database and
    used as the system prompt. Otherwise the currently active prompt is used,
    falling back to the bundled :data:`DEFAULT_SYSTEM_PROMPT` if none exists.
    """
    owns_session = db is None
    if owns_session:
        db = SessionLocal()

    assert db is not None
    resolved_prompt_id, prompt_content = _resolve_prompt(db, prompt_id)
    client = OpenAI()
    started = time.perf_counter()
    fields, input_tokens, output_tokens = _call_model(client, doc, prompt_content)
    latency_ms = int((time.perf_counter() - started) * 1000)
    cost_usd = _estimate_cost_usd(input_tokens, output_tokens)

    run = ExtractionRun(
        id=str(uuid.uuid4()),
        document_id=doc.id,
        prompt_id=resolved_prompt_id,
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
