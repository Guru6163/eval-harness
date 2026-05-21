#!/usr/bin/env python3
"""Seed ExtractBench SQLite database with mock extraction documents."""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

# Allow imports from apps/api when run as `python scripts/seed.py`
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal, engine  # noqa: E402
from app.extraction import DEFAULT_SYSTEM_PROMPT  # noqa: E402
from app.models import Base, Document, GroundTruth, Prompt  # noqa: E402
from scripts.seed_data import DOCUMENT_SPECS, SCORED_FIELDS  # noqa: E402

NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def stable_id(key: str) -> str:
    return str(uuid.uuid5(NAMESPACE, key))


def seed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.add(
            Prompt(
                id=stable_id("prompt:default-v1"),
                name="Default v1",
                content=DEFAULT_SYSTEM_PROMPT,
                is_active=True,
            )
        )

        for spec in DOCUMENT_SPECS:
            doc_id = stable_id(spec["key"])
            document = Document(
                id=doc_id,
                filename=spec["filename"],
                doc_type=spec["doc_type"],
                source_format=spec["source_format"],
                raw_content=spec["raw_content"].strip(),
            )
            db.add(document)

            for field_name in SCORED_FIELDS:
                if field_name not in spec["ground_truth"]:
                    continue
                expected_value, is_required = spec["ground_truth"][field_name]
                db.add(
                    GroundTruth(
                        id=stable_id(f"{spec['key']}:{field_name}"),
                        document_id=doc_id,
                        field_name=field_name,
                        expected_value=expected_value,
                        is_required=is_required,
                    )
                )

        db.commit()
        print(
            f"Seeded {len(DOCUMENT_SPECS)} documents and "
            f"{len(DOCUMENT_SPECS) * len(SCORED_FIELDS)} ground truth rows."
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
