#!/usr/bin/env python3
"""Run extraction + scoring for every document and print a summary."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import select

from app.db import SessionLocal
from app.models import Document, Prompt
from app.prompt_templates import STRONG_V2_ID, WEAK_V1_ID
from app.services import average_field_score, run_extraction_and_scoring


def run_for_prompt(db, documents: list[Document], prompt_id: str, prompt_name: str) -> None:
    print(f"\n{'=' * 48}")
    print(f"Prompt: {prompt_name}")
    print("=" * 48)
    print(f"Running extraction on {len(documents)} documents...\n")

    totals: list[float] = []
    total_latency_ms = 0
    total_cost = 0.0

    for i, doc in enumerate(documents, 1):
        print(f"  [{i:02d}/{len(documents)}] {doc.filename}")
        run_out = run_extraction_and_scoring(db, doc.id, prompt_id=prompt_id)
        if run_out.field_scores:
            avg = sum(s.score for s in run_out.field_scores) / len(run_out.field_scores)
            totals.append(avg)
        total_latency_ms += run_out.latency_ms
        total_cost += run_out.cost_usd

    print()
    if totals:
        overall = sum(totals) / len(totals)
        print(f"  Overall accuracy : {overall * 100:.1f}%")
    else:
        print("  Overall accuracy : —")
    print(f"  Documents        : {len(documents)}")
    print(f"  Fields scored    : {len(documents) * 7}")
    print(f"  Avg latency      : {total_latency_ms / len(documents) / 1000:.1f}s")
    print(f"  Total API cost   : ${total_cost:.4f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run ExtractBench eval")
    parser.add_argument(
        "--prompt-id",
        help="Run with a specific prompt id (default: active prompt)",
    )
    parser.add_argument(
        "--both",
        action="store_true",
        help="Run Weak V1 and Strong V2 sequentially",
    )
    args = parser.parse_args()

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

        if args.both:
            for prompt_id in (WEAK_V1_ID, STRONG_V2_ID):
                prompt = db.get(Prompt, prompt_id)
                name = prompt.name if prompt else prompt_id
                run_for_prompt(db, documents, prompt_id, name)
            return

        if args.prompt_id:
            prompt = db.get(Prompt, args.prompt_id)
            name = prompt.name if prompt else args.prompt_id
            run_for_prompt(db, documents, args.prompt_id, name)
            return

        active = db.scalar(
            select(Prompt).where(Prompt.is_active.is_(True)).limit(1)
        )
        prompt_id = active.id if active else None
        name = active.name if active else "active/default"
        run_for_prompt(db, documents, prompt_id, name)
    finally:
        db.close()


if __name__ == "__main__":
    main()
