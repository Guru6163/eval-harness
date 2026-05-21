"""Apply lightweight SQLite schema updates for existing databases."""

from __future__ import annotations

import uuid

from sqlalchemy import inspect, select, text

from app.db import SessionLocal, engine
from app.extraction import DEFAULT_SYSTEM_PROMPT
from app.models import Base, Prompt

NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
DEFAULT_PROMPT_ID = str(uuid.uuid5(NAMESPACE, "prompt:default-v1"))


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
                    id=DEFAULT_PROMPT_ID,
                    name="Default v1",
                    content=DEFAULT_SYSTEM_PROMPT,
                    is_active=True,
                )
            )
            db.commit()
