"""Bundled eval prompts (seeded into the DB; editable in /prompt UI)."""

from __future__ import annotations

import uuid

NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

WEAK_V1_ID = str(uuid.uuid5(NAMESPACE, "prompt:weak-v1"))
STRONG_V2_ID = str(uuid.uuid5(NAMESPACE, "prompt:strong-v2"))

_JSON_SCHEMA = """{
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
}"""

WEAK_V1_PROMPT = f"""You extract structured procurement fields from messy business documents.
Return ONLY a single JSON object with no markdown fences and no commentary.
The JSON must match this schema exactly:
{_JSON_SCHEMA}
Use null for unknown fields. Use ISO date YYYY-MM-DD for validity_date when possible.

{{document_content}}"""

STRONG_V2_PROMPT = f"""You extract structured procurement fields from messy business documents.
Return ONLY a single JSON object with no markdown fences and no commentary.
The JSON must match this schema exactly:
{_JSON_SCHEMA}
Use null for unknown fields. Use ISO date YYYY-MM-DD for validity_date when possible.

RULES BY FIELD

vendor_name:
- Use the entity that ISSUED the quote, invoice, or purchase order (letterhead, sign-off, seller).
- Do NOT use the customer, forwarder, or supplier brands listed only as "distributor for" or "on behalf of".
- In forwarded email threads, use the innermost supplier sign-off — not the company that forwarded the message.

line_items:
- Each priced row, tier band, or distinct product line counts as one line item (tiered pricing = one item per tier).
- In amended or revised purchase orders, extract ONLY lines marked ACTIVE, current, or with no status marker. Skip any lines marked CANCELLED, REMOVED, VOID, or ORIGINAL.
- If quantity is ambiguous ("the usual amount", "a few boxes" without a number), set quantity to null — never guess.

total_amount:
- Prefer the document's final quoted or PO total in the document's primary currency.
- If the document shows multiple totals (net, discounted net, gross with VAT), always return the discounted net pre-tax amount. If only gross+VAT is shown with no net, return null.
- If multiple currencies appear with no single combined total, return null — do not add EUR and USD amounts.

currency:
- Primary billing currency of the quote (EUR, USD, etc.). If billing is explicitly split with no single total, still set the dominant or first-stated currency.

lead_time_days:
- Integer days only. Convert weeks: 1 week = 7 days ("same week" / "within the week" = 7).
- Return null for relative delivery phrases with no fixed day count ("by Friday", "end of next week").

payment_terms:
- Copy the payment terms character-for-character from the document. Do not reformat, normalize, or simplify.
- If document says "2% 10 Net 30" return "2% 10 Net 30"
- If document says "14 days 2pct discount, 30 days net" return that exact string
- If document says "50% deposit balance on shipment" return that exact string
- Never simplify to just "Net 30" if the original has more detail
- If not mentioned return null

validity_date:
- Quote/offer expiry as ISO YYYY-MM-DD. Parse US and European date formats.

OCR / scanned_pdf:
- Correct common OCR substitutions in numbers and names: O↔0, l↔1, B↔8, S↔5 (e.g. "5OO"→500, "HALCY0N"→Halcyon).

{{document_content}}"""
