#!/usr/bin/env python3
"""Seed ExtractBench with hand-authored documents and ground truth (no LLM calls)."""

from __future__ import annotations

import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select  # noqa: E402

from app.db import SessionLocal, engine  # noqa: E402
from app.prompt_templates import (  # noqa: E402
    STRONG_V2_ID,
    STRONG_V2_PROMPT,
    WEAK_V1_ID,
    WEAK_V1_PROMPT,
)
from app.models import (  # noqa: E402
    Base,
    Document,
    DocumentType,
    ExtractionRun,
    GroundTruth,
    Prompt,
    SourceFormat,
)

NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")

SCORED_FIELDS = (
    "vendor_name",
    "line_items",
    "total_amount",
    "currency",
    "lead_time_days",
    "payment_terms",
    "validity_date",
)


def stable_id(key: str) -> str:
    return str(uuid.uuid5(NAMESPACE, key))


DOCUMENTS: list[dict] = [
    {
        "key": "doc-01-northbridge",
        "filename": "northbridge_rfq_clean.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """
NORTHBRIDGE STEEL COMPONENTS
Quote #NB-2026-0891 | Quote Date: March 3, 2026
Valid Until: April 3, 2026

Bill To: Meridian Manufacturing Corp

Part No.    Description                 Qty    Unit Price    Total
NS-4417     316 SS Valve Body 2in       500    $4.20         $2,100.00
NS-4418     316 SS Valve Body 3in       200    $6.80         $1,360.00
NS-7701     Hex Bolt M8x40 Grade 8.8    5000   $0.18         $900.00

Subtotal: $4,360.00
Payment Terms: Net 30
Lead Time: 6 weeks ARO
""",
        "ground_truth": {
            "vendor_name": ("Northbridge Steel Components", True),
            "line_items": (3, True),
            "total_amount": (4360.00, True),
            "currency": ("USD", True),
            "lead_time_days": (42, True),
            "payment_terms": ("Net 30", True),
            "validity_date": ("2026-04-03", True),
        },
    },
    {
        "key": "doc-02-halcyon-email",
        "filename": "halcyon_email_quote.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.email_body,
        "raw_content": """
From: sarah.chen@halcyonfasteners.com
Subject: Re: RFQ #2026-445

Hi Marcus,

For the M6 hex bolts (PN 445-A) we can do 10,000 pcs at 
12 cents each. If you go to 50,000 that drops to 9 cents.
Lead time 4 weeks from PO.

M8 flange nuts (445-B) - 8,000 in stock at $0.22 each, 
ships within the week.

Net 30. Quote good for 60 days from today (March 5, 2026).

Sarah Chen
Halcyon Fasteners
""",
        "ground_truth": {
            "vendor_name": ("Halcyon Fasteners", True),
            "line_items": (2, True),
            "total_amount": (None, False),
            "currency": ("USD", True),
            "lead_time_days": (28, True),
            "payment_terms": ("Net 30", True),
            "validity_date": ("2026-05-04", True),
        },
    },
    {
        "key": "doc-03-meridian-ocr",
        "filename": "meridian_scanned_ocr_errors.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """
MERIDI4N VALVE SOLUTIONS
Qu0te Date: 02/18/2026
Exp1ry: 03/18/2026

ltem    Descr1ption           Qty    Pr1ce
V-221   Gate Valve 4in CS     l00    $48.5O
V-222   Gate Valve 6in CS      50    $B4.00
V-230   Check Valve 4in        75    $52.OO

T0tal: $11,475.00
Terms: 5O% deposit balance on sh1pment
Lead t1me: 8 weeks
""",
        "ground_truth": {
            "vendor_name": ("Meridian Valve Solutions", True),
            "line_items": (3, True),
            "total_amount": (11475.00, True),
            "currency": ("USD", True),
            "lead_time_days": (56, True),
            "payment_terms": ("50% deposit, balance on shipment", True),
            "validity_date": ("2026-03-18", True),
        },
    },
    {
        "key": "doc-04-technik-euro",
        "filename": "technik_euro_invoice.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """
Technik Verbindungen GmbH
Angebot Nr: TV-2026-0234
Datum: 15. Februar 2026
Gultig bis: 17. Marz 2026

Pos  Artikelnr   Bezeichnung          Menge    Einzelpreis   Gesamt
1    TV-8801      Sechskantschraube    10000    0,08 EUR      800,00 EUR
2    TV-8802      Unterlegscheibe      10000    0,03 EUR      300,00 EUR

Nettobetrag:  1.100,00 EUR
MwSt 19pct:     209,00 EUR
Bruttobetrag: 1.309,00 EUR

Zahlungsziel: 30 Tage netto
Lieferzeit: 3 Wochen
""",
        "ground_truth": {
            "vendor_name": ("Technik Verbindungen GmbH", True),
            "line_items": (2, True),
            "total_amount": (1100.00, True),
            "currency": ("EUR", True),
            "lead_time_days": (21, True),
            "payment_terms": ("Net 30", True),
            "validity_date": ("2026-03-17", True),
        },
    },
    {
        "key": "doc-05-cascade-tiered",
        "filename": "cascade_tiered_pricing.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.email_body,
        "raw_content": """
From: quotes@cascadematerials.com

Lumber pricing as requested:

2x4x8 SPF Stud Grade:
  1 to 99 units: $4.85 each
  100 to 499 units: $4.20 each
  500 plus units: $3.75 each

2x6x8 SPF No.2:
  1 to 99 units: $6.90 each
  100 to 499 units: $6.10 each
  500 plus units: $5.50 each

In stock, ships same week.
Net 15 approved accounts.
Quote valid 30 days.
""",
        "ground_truth": {
            "vendor_name": ("Cascade Materials", True),
            "line_items": (6, True),
            "total_amount": (None, False),
            "currency": ("USD", True),
            "lead_time_days": (7, True),
            "payment_terms": ("Net 15", True),
            "validity_date": (None, False),
        },
    },
    {
        "key": "doc-06-forwarded-thread",
        "filename": "forwarded_thread_buried_quote.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.email_body,
        "raw_content": """
From: marcus.reid@meridianmfg.com
To: procurement@meridianmfg.com
Subject: Fwd: Re: Re: RFQ bolt package

FYI see below - James approved Tuesday

-------- Forwarded Message --------
From: purchasing@meridianmfg.com
Date: March 10, 2026

James can you approve the below?

-------- Forwarded Message --------
From: tom@apexfasteners.net
Date: March 9, 2026

As discussed:
316SS socket head cap screws M10x30
Qty 2000 at $1.45 each = $2,900.00
Lead 3 weeks. Net 30. Valid 45 days.

Tom
Apex Fasteners
""",
        "ground_truth": {
            "vendor_name": ("Apex Fasteners", True),
            "line_items": (1, True),
            "total_amount": (2900.00, True),
            "currency": ("USD", True),
            "lead_time_days": (21, True),
            "payment_terms": ("Net 30", True),
            "validity_date": (None, False),
        },
    },
    {
        "key": "doc-07-multi-currency",
        "filename": "multi_currency_mixed.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.email_body,
        "raw_content": """
From: procurement@eurosupply.de

Dear buyer,

Please find our quotation:

Item 1: Precision bearing SKF-6204  
Quantity: 500 pcs
Price: 3,80 EUR each
Total: 1.900,00 EUR

Item 2: Shaft seal 35x50x8
Quantity: 200 pcs  
Price: $2.10 each (USD price on request)
Total: $420.00

Invoice will be split: EUR portion billed in EUR, 
USD portion billed in USD.
Lead time 5 weeks. Payment 30 days net.
Valid through 15 April 2026.
""",
        "ground_truth": {
            "vendor_name": ("Eurosupply", True),
            "line_items": (2, True),
            "total_amount": (None, False),
            "currency": ("EUR", True),
            "lead_time_days": (35, True),
            "payment_terms": ("Net 30", True),
            "validity_date": ("2026-04-15", True),
        },
    },
    {
        "key": "doc-08-ambiguous-vendor",
        "filename": "ambiguous_vendor_letterhead.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """
INDUSTRIAL SUPPLY PARTNERS
Distributor for: Northbridge Steel | Halcyon Fasteners | Apex Industries

QUOTATION TO: Delta Manufacturing Inc
DATE: March 12, 2026
VALID: 30 days

On behalf of Northbridge Steel Components:
  NS-4417  316 SS Valve Body 2in  x100  @ $4.50 ea = $450.00

On behalf of Halcyon Fasteners:
  HF-M8-30  Hex Bolt M8x30  x2000  @ $0.15 ea = $300.00

TOTAL THIS QUOTE: $750.00
LEAD TIME: 2 weeks
PAYMENT: Net 30
""",
        "ground_truth": {
            "vendor_name": ("Industrial Supply Partners", True),
            "line_items": (2, True),
            "total_amount": (750.00, True),
            "currency": ("USD", True),
            "lead_time_days": (14, True),
            "payment_terms": ("Net 30", True),
            "validity_date": ("2026-04-11", True),
        },
    },
    {
        "key": "doc-09-po-cancelled",
        "filename": "po_with_cancelled_lines.txt",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """
PURCHASE ORDER AMENDMENT
PO Number: PO-2026-8801 (Revision 2)
Date: March 14, 2026
Vendor: Apex Fasteners

ORIGINAL LINE ITEMS (Revision 1):
Line 1: M10x30 SHCS 316SS  x2000  @ $1.45  = $2,900.00  [CANCELLED]
Line 2: M8x25 SHCS 316SS   x1000  @ $1.20  = $1,200.00  [CANCELLED]

REVISED LINE ITEMS (Revision 2):
Line 1: M10x35 SHCS 316SS  x2000  @ $1.52  = $3,040.00  [ACTIVE]
Line 2: M8x25 SHCS 316SS   x1500  @ $1.20  = $1,800.00  [ACTIVE]

REVISED PO TOTAL: $4,840.00
Payment: Net 30
Required by: April 14, 2026
""",
        "ground_truth": {
            "vendor_name": ("Apex Fasteners", True),
            "line_items": (2, True),
            "total_amount": (4840.00, True),
            "currency": ("USD", True),
            "lead_time_days": (None, False),
            "payment_terms": ("Net 30", True),
            "validity_date": (None, False),
        },
    },
    {
        "key": "doc-10-net-vs-gross",
        "filename": "invoice_net_vs_gross.txt",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """
TECHNIK PRECISION GMBH
Quotation TG-2026-0445
Date: 1 March 2026
Valid: 31 March 2026

Customer: Global Parts Inc

Description              Qty    Unit Net    Line Net
Precision shaft M20      100    42,50 EUR   4.250,00 EUR
Bearing housing B-40      50    87,00 EUR   4.350,00 EUR

Net Total:        8.600,00 EUR
Discount 5pct:     -430,00 EUR
Discounted Net:   8.170,00 EUR
VAT 19pct:        1.552,30 EUR
Gross Total:      9.722,30 EUR

Payment: 14 days 2pct discount, 30 days net
Delivery: 4 weeks from order confirmation
""",
        "ground_truth": {
            "vendor_name": ("Technik Precision GmbH", True),
            "line_items": (2, True),
            "total_amount": (8170.00, True),
            "currency": ("EUR", True),
            "lead_time_days": (28, True),
            "payment_terms": ("14 days 2% discount, 30 days net", True),
            "validity_date": ("2026-03-31", True),
        },
    },
    {
        "key": "doc-11-ambiguous-qty",
        "filename": "request_ambiguous_quantities.txt",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.email_body,
        "raw_content": """
From: site.manager@buildfast.com
Subject: Material request - Site 4

Hi,

For the next phase we'll need:

The usual amount of 2x4 lumber (same as last month's order)
About 50 sheets of OSB, maybe more if price is right
A few boxes of 3in framing nails - say 5 boxes to start
Delivery to Site 4 by end of next week

No rush on pricing but need delivery confirmed ASAP.

Mike
Buildfast Construction
""",
        "ground_truth": {
            "vendor_name": ("Buildfast Construction", True),
            "line_items": (3, True),
            "total_amount": (None, False),
            "currency": (None, False),
            "lead_time_days": (None, False),
            "payment_terms": (None, False),
            "validity_date": (None, False),
        },
    },
    {
        "key": "doc-12-scanned-handwritten",
        "filename": "scanned_handwritten_po.txt",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """
PURCHASE 0RDER                     P0# 9921-B
Dat3: F3b 28 2026

V3nd0r: HALCY0N FAST3N3RS

[handwritten table - OCR output:]
ltem          Qty    Pr1ce    T0tal
M6 H3x B0lts  5OO    O.12     6O.OO
M8 Fl Nuts    25O    O.22     55.OO
M1O Wash3rs   1OOO   O.O8     8O.OO

T0TAL: $195.OO

[handwritten:] rush order - need by friday
[handwritten:] approved by J.Smith
Net 3O
""",
        "ground_truth": {
            "vendor_name": ("Halcyon Fasteners", True),
            "line_items": (3, True),
            "total_amount": (195.00, True),
            "currency": ("USD", True),
            "lead_time_days": (None, False),
            "payment_terms": ("Net 30", True),
            "validity_date": (None, False),
        },
    },
]


def seed() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    ground_truth_count = 0
    try:
        db.add(
            Prompt(
                id=WEAK_V1_ID,
                name="Weak V1",
                content=WEAK_V1_PROMPT,
                is_active=False,
            )
        )
        db.add(
            Prompt(
                id=STRONG_V2_ID,
                name="Strong V2",
                content=STRONG_V2_PROMPT,
                is_active=True,
            )
        )

        for spec in DOCUMENTS:
            doc_id = stable_id(spec["key"])
            db.add(
                Document(
                    id=doc_id,
                    filename=spec["filename"],
                    doc_type=spec["doc_type"],
                    source_format=spec["source_format"],
                    raw_content=spec["raw_content"].strip(),
                )
            )

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
                ground_truth_count += 1

        db.commit()

        doc_count = db.scalar(select(func.count()).select_from(Document)) or 0
        gt_count = db.scalar(select(func.count()).select_from(GroundTruth)) or 0
        run_count = db.scalar(select(func.count()).select_from(ExtractionRun)) or 0

        if doc_count != len(DOCUMENTS):
            raise RuntimeError(f"Expected {len(DOCUMENTS)} documents, found {doc_count}")
        if gt_count != ground_truth_count:
            raise RuntimeError(
                f"Expected {ground_truth_count} ground truth rows, found {gt_count}"
            )
        if run_count != 0:
            raise RuntimeError(f"Expected 0 extraction runs, found {run_count}")

        print(f"Seeded {len(DOCUMENTS)} documents with hand-authored ground truth")
        print(f"Total ground truth fields: {ground_truth_count}")
        print("Prompts: Weak V1, Strong V2 (edit Strong V2 at /prompt)")
        print("Ready to run evaluation")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
