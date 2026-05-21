"""In-memory markers for background run-all jobs (progress polling)."""

from __future__ import annotations

import time

_active_run_all_started: dict[str, float] = {}


def mark_run_all_started(prompt_id: str) -> float:
    ts = time.time()
    _active_run_all_started[prompt_id] = ts
    return ts


def run_all_started_at(prompt_id: str) -> float | None:
    return _active_run_all_started.get(prompt_id)


def clear_run_all(prompt_id: str) -> None:
    _active_run_all_started.pop(prompt_id, None)
