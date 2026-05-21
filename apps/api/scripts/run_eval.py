#!/usr/bin/env python3
"""Run extraction + scoring for every document and print a summary."""

from __future__ import annotations

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Document
from app.services import average_field_score, run_extraction_and_scoring


def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY is not set.", file=sys.stderr)
        print("Copy apps/api/.env.example to apps/api/.env and add your key.", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        documents = list(db.scalars(select(Document)).all())
        if not documents:
            print("No documents found. Run: python scripts/seed.py")
            sys.exit(1)

        print(f"Running extraction on {len(documents)} documents...\n")
        totals: list[float] = []
        total_latency_ms = 0
        total_cost = 0.0

        for i, doc in enumerate(documents, 1):
            print(f"  [{i:02d}/{len(documents)}] {doc.filename}")
            run_out = run_extraction_and_scoring(db, doc.id)
            if run_out.field_scores:
                avg = sum(s.score for s in run_out.field_scores) / len(
                    run_out.field_scores
                )
                totals.append(avg)
            total_latency_ms += run_out.latency_ms
            total_cost += run_out.cost_usd

        print("\n" + "=" * 48)
        print("ExtractBench eval summary")
        print("=" * 48)
        if totals:
            overall = sum(totals) / len(totals)
            print(f"  Overall accuracy : {overall * 100:.1f}%")
        else:
            print("  Overall accuracy : —")
        print(f"  Documents        : {len(documents)}")
        print(f"  Fields scored    : {len(documents) * 7}")
        print(
            f"  Avg latency      : {total_latency_ms / len(documents) / 1000:.1f}s"
        )
        print(f"  Total API cost   : ${total_cost:.4f}")
        print("=" * 48)
    finally:
        db.close()


if __name__ == "__main__":
    main()
