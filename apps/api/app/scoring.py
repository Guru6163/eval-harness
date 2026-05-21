from __future__ import annotations

import re
import uuid
from datetime import date, datetime
from typing import Any, TYPE_CHECKING

from dateutil import parser as date_parser

from app.models import ExtractionRun, FieldScore, GroundTruth, MatchType

SCORED_FIELD_NAMES = (
    "vendor_name",
    "line_items",
    "total_amount",
    "currency",
    "lead_time_days",
    "payment_terms",
    "validity_date",
)

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

FUZZY_THRESHOLD = 0.85
FUZZY_PARTIAL_THRESHOLD = 0.70
VENDOR_FUZZY_THRESHOLD = 0.80

_CURRENCY_SYMBOLS = re.compile(r"[$€£¥]")
_VENDOR_SUFFIXES = re.compile(
    r"\b(?:inc\.?|llc|ltd\.?|co\.?|corp\.?)\s*$", re.IGNORECASE
)

_CURRENCY_ALIASES: dict[str, str] = {
    "usd": "USD",
    "us dollar": "USD",
    "us dollars": "USD",
    "dollar": "USD",
    "dollars": "USD",
    "eur": "EUR",
    "euro": "EUR",
    "euros": "EUR",
    "gbp": "GBP",
    "pound": "GBP",
    "pounds": "GBP",
    "british pound": "GBP",
    "jpy": "JPY",
    "yen": "JPY",
}


def _levenshtein_ratio(a: str, b: str) -> float:
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    rows, cols = len(a) + 1, len(b) + 1
    dist = [[0] * cols for _ in range(rows)]
    for i in range(rows):
        dist[i][0] = i
    for j in range(cols):
        dist[0][j] = j
    for i in range(1, rows):
        for j in range(1, cols):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dist[i][j] = min(
                dist[i - 1][j] + 1,
                dist[i][j - 1] + 1,
                dist[i - 1][j - 1] + cost,
            )
    distance = dist[rows - 1][cols - 1]
    return 1.0 - distance / max(len(a), len(b))


def _normalize(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip().lower()


def _is_empty(value: Any) -> bool:
    return value is None or value == "" or value == [] or value == {}


def _match_type(score: float, expected: Any, actual: Any) -> MatchType:
    if score >= 1.0:
        return MatchType.exact
    if score > 0:
        return MatchType.partial
    if _is_empty(actual):
        return MatchType.missing
    return MatchType.wrong


def _parse_amount(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    text = _CURRENCY_SYMBOLS.sub("", text)
    text = text.replace(",", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _normalize_vendor(name: str) -> str:
    s = name.strip().lower()
    s = _VENDOR_SUFFIXES.sub("", s).strip()
    return re.sub(r"\s+", " ", s)


def _normalize_currency(value: Any) -> str:
    if _is_empty(value):
        return ""
    raw = str(value).strip()
    key = raw.lower()
    if key in _CURRENCY_ALIASES:
        return _CURRENCY_ALIASES[key]
    return raw.upper()


def _parse_int_value(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    text = str(value).strip()
    if not text:
        return None
    try:
        return int(float(text.replace(",", "")))
    except ValueError:
        return None


def _parse_calendar_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    if not text:
        return None
    try:
        return date_parser.parse(text, dayfirst=False).date()
    except (ValueError, TypeError, OverflowError):
        return None


def _score_vendor(expected: Any, actual: Any) -> tuple[float, str]:
    if _is_empty(expected):
        return 1.0, "No expected vendor"
    if _is_empty(actual):
        return 0.0, "Missing vendor"

    exp = _normalize_vendor(str(expected))
    act = _normalize_vendor(str(actual))
    if exp == act:
        return 1.0, "Exact match"
    ratio = _levenshtein_ratio(exp, act)
    if ratio > VENDOR_FUZZY_THRESHOLD:
        return 0.7, f"Fuzzy match ({ratio:.2f})"
    return 0.0, f"No match ({ratio:.2f})"


def _score_total_amount(expected: Any, actual: Any) -> tuple[float, str]:
    exp_val = _parse_amount(expected)
    act_val = _parse_amount(actual)
    if exp_val is None or act_val is None:
        return 0.0, "Missing amount"
    if exp_val == 0:
        return (1.0, "Both zero") if act_val == 0 else (0.0, "Expected zero")
    diff_pct = abs(act_val - exp_val) / abs(exp_val) * 100
    if diff_pct <= 1:
        return 1.0, f"Within 1% ({diff_pct:.2f}%)"
    if diff_pct <= 5:
        return 0.5, f"Within 5% ({diff_pct:.2f}%)"
    return 0.0, f"Outside 5% ({diff_pct:.2f}%)"


def _score_currency(expected: Any, actual: Any) -> tuple[float, str]:
    exp = _normalize_currency(expected)
    act = _normalize_currency(actual)
    if not exp:
        return 1.0, "No expected currency"
    if not act:
        return 0.0, "Missing currency"
    if exp == act:
        return 1.0, "Exact match"
    return 0.0, f"Mismatch ({act} vs {exp})"


def _score_lead_time(expected: Any, actual: Any) -> tuple[float, str]:
    if expected is None:
        if actual is None or _is_empty(actual):
            return 1.0, "Not required"
        return 0.0, "Hallucinated lead time"

    exp_days = _parse_int_value(expected)
    act_days = _parse_int_value(actual)
    if exp_days is None:
        return 0.0, "Invalid expected lead time"
    if act_days is None:
        return 0.0, "Missing lead time"
    delta = abs(exp_days - act_days)
    if delta <= 1:
        return 1.0, f"Within ±1 day (Δ{delta})"
    if delta <= 3:
        return 0.7, f"Within ±3 days (Δ{delta})"
    return 0.0, f"Off by {delta} days"


def _score_validity_date(expected: Any, actual: Any) -> tuple[float, str]:
    if _is_empty(expected):
        return 1.0, "No expected date"
    if _is_empty(actual):
        return 0.0, "Missing date"

    exp_date = _parse_calendar_date(expected)
    act_date = _parse_calendar_date(actual)
    if exp_date is None:
        return 0.0, "Invalid expected date"
    if act_date is None:
        return 0.0, "Invalid extracted date"
    if exp_date == act_date:
        return 1.0, f"Same date ({exp_date.isoformat()})"
    return 0.0, f"Date mismatch ({act_date} vs {exp_date})"


def _score_fuzzy_string(expected: Any, actual: Any) -> tuple[float, str]:
    exp = _normalize(expected)
    act = _normalize(actual)
    if not exp:
        return 1.0, "No expected value"
    if not act:
        return 0.0, "Missing value"
    if exp == act:
        return 1.0, "Exact match"
    ratio = _levenshtein_ratio(exp, act)
    if ratio > FUZZY_THRESHOLD:
        return 1.0, f"Fuzzy match ({ratio:.2f})"
    if ratio > FUZZY_PARTIAL_THRESHOLD:
        return 0.7, f"Partial fuzzy ({ratio:.2f})"
    return 0.0, f"No match ({ratio:.2f})"


def _line_item_dict(item: Any) -> dict[str, Any]:
    if isinstance(item, dict):
        return item
    return item.model_dump() if hasattr(item, "model_dump") else {}


def _score_line_items(expected: Any, actual: Any) -> tuple[float, str]:
    expected_items = expected if isinstance(expected, list) else []
    extracted_items = actual if isinstance(actual, list) else []
    if not expected_items:
        return 1.0, "No expected line items"

    extracted = [_line_item_dict(i) for i in extracted_items]
    per_item_scores: list[float] = []

    for exp_raw in expected_items:
        exp = _line_item_dict(exp_raw)
        exp_sku = _normalize(exp.get("sku"))
        exp_qty = exp.get("quantity")
        best = 0.0
        for ext in extracted:
            sku_score = 1.0 if exp_sku and _normalize(ext.get("sku")) == exp_sku else 0.0
            ext_qty = ext.get("quantity")
            qty_score = (
                1.0
                if exp_qty is not None
                and ext_qty is not None
                and float(ext_qty) == float(exp_qty)
                else 0.0
            )
            best = max(best, (sku_score + qty_score) / 2)
        per_item_scores.append(best)

    avg = sum(per_item_scores) / len(per_item_scores)
    matched = sum(1 for s in per_item_scores if s > 0)
    return avg, f"{matched}/{len(expected_items)} items matched"


def _score_field(field_name: str, expected: Any, actual: Any) -> tuple[float, str]:
    if field_name == "vendor_name":
        return _score_vendor(expected, actual)
    if field_name == "total_amount":
        return _score_total_amount(expected, actual)
    if field_name == "currency":
        return _score_currency(expected, actual)
    if field_name == "lead_time_days":
        return _score_lead_time(expected, actual)
    if field_name == "validity_date":
        return _score_validity_date(expected, actual)
    if field_name == "line_items":
        return _score_line_items(expected, actual)
    if field_name == "payment_terms":
        return _score_fuzzy_string(expected, actual)
    return 0.0, f"Unknown field: {field_name}"


def score_extraction(
    run: ExtractionRun,
    truth: list[GroundTruth],
    db: Session | None = None,
    *,
    replace_existing: bool = False,
) -> list[FieldScore]:
    """Score an extraction run against ground truth and persist FieldScore rows."""
    from sqlalchemy import delete

    from app.db import SessionLocal

    owns_session = db is None
    if owns_session:
        db = SessionLocal()

    assert db is not None
    if replace_existing:
        db.execute(delete(FieldScore).where(FieldScore.run_id == run.id))
        db.flush()
        db.expire(run, ["field_scores"])

    extracted = run.extracted_value or {}
    truth_by_field = {row.field_name: row for row in truth}
    scores: list[FieldScore] = []

    for field_name in SCORED_FIELD_NAMES:
        gt_row = truth_by_field.get(field_name)
        expected = gt_row.expected_value if gt_row else None
        actual = extracted.get(field_name)
        score_val, notes = _score_field(field_name, expected, actual)
        field_score = FieldScore(
            id=str(uuid.uuid4()),
            run_id=run.id,
            field_name=field_name,
            score=score_val,
            match_type=_match_type(score_val, expected, actual),
            notes=notes,
        )
        db.add(field_score)
        scores.append(field_score)

    db.flush()
    if owns_session:
        db.commit()
        db.close()

    return scores
