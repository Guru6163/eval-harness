"""Apply lightweight SQLite schema updates for existing databases."""

from __future__ import annotations

import uuid

from sqlalchemy import inspect, select, text

from app.db import SessionLocal, engine
from app.models import Base, Prompt
from app.prompt_templates import STRONG_V2_ID, STRONG_V2_PROMPT


def ensure_schema() -> None:
    """Create missing tables/columns and seed a default prompt when needed."""
    Base.metadata.create_all(bind=engine)

    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    if "extraction_runs" in table_names:
        columns = {col["name"] for col in inspector.get_columns("extraction_runs")}
        if "prompt_id" not in columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        "ALTER TABLE extraction_runs "
                        "ADD COLUMN prompt_id VARCHAR(36) "
                        "REFERENCES prompts(id)"
                    )
                )

    if "prompts" not in table_names:
        return

    with SessionLocal() as db:
        has_prompt = db.scalar(select(Prompt.id).limit(1)) is not None
        if not has_prompt:
            db.add(
                Prompt(
                    id=STRONG_V2_ID,
                    name="Strong V2",
                    content=STRONG_V2_PROMPT,
                    is_active=True,
                )
            )
            db.commit()
