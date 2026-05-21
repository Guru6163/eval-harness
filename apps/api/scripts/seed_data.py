"""Mock document specs for seeding ExtractBench."""

from app.models import DocumentType, SourceFormat

SCORED_FIELDS = (
    "vendor_name",
    "line_items",
    "total_amount",
    "currency",
    "lead_time_days",
    "payment_terms",
    "validity_date",
)


def _gt(
    vendor_name: str,
    line_items: list[dict],
    total_amount: float,
    currency: str,
    lead_time_days: int | None,
    payment_terms: str,
    validity_date: str,
    *,
    lead_time_required: bool = True,
) -> dict[str, tuple[object, bool]]:
    return {
        "vendor_name": (vendor_name, True),
        "line_items": (line_items, True),
        "total_amount": (total_amount, True),
        "currency": (currency, True),
        "lead_time_days": (lead_time_days, lead_time_required),
        "payment_terms": (payment_terms, True),
        "validity_date": (validity_date, True),
    }


DOCUMENT_SPECS: list[dict] = [
    # --- 6 supplier quotes ---
    {
        "key": "sq-01",
        "filename": "northbridge_steel_quote_2024-1187.pdf",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """NORTHBRIDGE STEEL CO.
Quotation QT-2024-1187 | 14 March 2024

Bill To: Riverside Industrial Contractors
Project: Warehouse expansion — structural package

Line items:
  SKU NS-BEAM-240    W12x26 structural beam (20 ft)     Qty 48    USD 312.00/ea
  SKU NS-PLATE-12    1/2" A36 plate 4x8 ft               Qty 24    USD 189.50/ea

Subtotal: USD 19,524.00
Freight (FOB mill): USD 1,850.00
Total: USD 21,374.00

Currency: USD
Lead time: 21 business days from PO receipt
Payment terms: Net 45
Quote valid through: 2024-04-30
""",
        "ground_truth": _gt(
            "Northbridge Steel Co.",
            [
                {
                    "sku": "NS-BEAM-240",
                    "description": 'W12x26 structural beam (20 ft)',
                    "quantity": 48,
                    "unit_price": 312.0,
                    "currency": "USD",
                },
                {
                    "sku": "NS-PLATE-12",
                    "description": '1/2" A36 plate 4x8 ft',
                    "quantity": 24,
                    "unit_price": 189.5,
                    "currency": "USD",
                },
            ],
            21374.0,
            "USD",
            21,
            "Net 45",
            "2024-04-30",
        ),
    },
    {
        "key": "sq-02",
        "filename": "halcyon_fasteners_quote_FQ-8821.pdf",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """HALCYON FASTENERS LTD.
Formal Quote FQ-8821

Customer: Apex Mechanical Services
Date: 2024-03-22

| SKU          | Description                         | Qty  | Unit   |
| HF-M12-80    | M12x80 A4-80 hex bolt (pack 100)    | 40   | 28.40  |
| HF-M16-100   | M16x100 Grade 8.8 bolt (pack 50)    | 25   | 41.20  |
| HF-NUT-M12   | M12 nylon insert lock nut (pack 100)| 40   | 19.85  |

Total amount: USD 2,469.25
Currency: USD
Delivery: 10 working days
Payment: 2% 10 Net 30
Valid until 2024-05-15
""",
        "ground_truth": _gt(
            "Halcyon Fasteners Ltd.",
            [
                {
                    "sku": "HF-M12-80",
                    "description": "M12x80 A4-80 hex bolt (pack 100)",
                    "quantity": 40,
                    "unit_price": 28.4,
                    "currency": "USD",
                },
                {
                    "sku": "HF-M16-100",
                    "description": "M16x100 Grade 8.8 bolt (pack 50)",
                    "quantity": 25,
                    "unit_price": 41.2,
                    "currency": "USD",
                },
                {
                    "sku": "HF-NUT-M12",
                    "description": "M12 nylon insert lock nut (pack 100)",
                    "quantity": 40,
                    "unit_price": 19.85,
                    "currency": "USD",
                },
            ],
            2469.25,
            "USD",
            10,
            "2% 10 Net 30",
            "2024-05-15",
        ),
    },
    {
        "key": "sq-03",
        "filename": "meridian_valves_scan_QT-4402.pdf",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """[OCR — MERIDIAN VALVES  quote #QT-4402]

M E R I D I A N   V A L V E S
~~~ QT-4402 ~~~  scanned 2024/02/18

Ball valve 2" SS316  MV-BV-2SS     x12 @ 184.00
Gate valve 4" flanged MV-GV-4FL     x6  @ 412.50
Actuator kit MV-ACT-01            x6  @  89.00

TOTAL .............. USD 5,892.00
(leadtime not legible on scan — see email follow-up)
Payment: Net 30
Expires: 15-Apr-2024
""",
        "ground_truth": _gt(
            "Meridian Valves",
            [
                {
                    "sku": "MV-BV-2SS",
                    "description": 'Ball valve 2" SS316',
                    "quantity": 12,
                    "unit_price": 184.0,
                    "currency": "USD",
                },
                {
                    "sku": "MV-GV-4FL",
                    "description": 'Gate valve 4" flanged',
                    "quantity": 6,
                    "unit_price": 412.5,
                    "currency": "USD",
                },
                {
                    "sku": "MV-ACT-01",
                    "description": "Actuator kit",
                    "quantity": 6,
                    "unit_price": 89.0,
                    "currency": "USD",
                },
            ],
            5892.0,
            "USD",
            None,
            "Net 30",
            "2024-04-15",
            lead_time_required=False,
        ),
    },
    {
        "key": "sq-04",
        "filename": "northbridge_lumber_scan_LQ-09.pdf",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """Northbridge Steel Co. — Lumber division (scanned fax)
Quote LQ-09

Customer asked for treated deck package. Pricing below is our best on
current cedar market; the 2x6x12 boards came in at forty-seven dollars
and change each once we factor treating, and posts are running one-twelve
per unit for 4x4x8.

Also throwing in carriage bolts HF-CB-38 at 0.85/ea qty 500 as line item.

2x6x12 treated — 120 pcs — (see above ~47.25/ea)
4x4x8 treated post — 60 pcs — (~112.00/ea)
HF-CB-38 carriage bolt 3/8 x 6 — 500 — 0.85

We're at about eighteen thousand two hundred for the lot before tax.
USD. Ship in ~3 weeks. Net 30. Good thru June 1 2024.
""",
        "ground_truth": _gt(
            "Northbridge Steel Co.",
            [
                {
                    "sku": "NB-LUM-2X6-12",
                    "description": "2x6x12 treated deck board",
                    "quantity": 120,
                    "unit_price": 47.25,
                    "currency": "USD",
                },
                {
                    "sku": "NB-LUM-4X4-8",
                    "description": "4x4x8 treated post",
                    "quantity": 60,
                    "unit_price": 112.0,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CB-38",
                    "description": "carriage bolt 3/8 x 6",
                    "quantity": 500,
                    "unit_price": 0.85,
                    "currency": "USD",
                },
            ],
            18200.0,
            "USD",
            15,
            "Net 30",
            "2024-06-01",
        ),
    },
    {
        "key": "sq-05",
        "filename": "meridian_valves_email_quote.eml",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.email_body,
        "raw_content": """From: quotes@meridian-valves.eu
To: procurement@riverside-contractors.com
Subject: RE: Ball valves + actuators — budget numbers

Hi team,

As discussed on the call, tiered pricing for the DN50 package:

  Tier 1 (1–10 units): EUR 215.00 / valve before VAT
  Tier 2 (11–25 units): EUR 198.50 / valve before VAT
  You're at 18 units so Tier 2 applies.

Actuator MV-ACT-EU: EUR 72.00 each, qty 18.

VAT 19% on top of net EUR 4,698.60 → gross EUR 5,591.33 total.
Payment 30 days EOM. Offer stands until 31/05/2024.

Regards,
Elena — Meridian Valves
""",
        "ground_truth": _gt(
            "Meridian Valves",
            [
                {
                    "sku": "MV-BV-DN50",
                    "description": "DN50 ball valve package (Tier 2)",
                    "quantity": 18,
                    "unit_price": 198.5,
                    "currency": "EUR",
                },
                {
                    "sku": "MV-ACT-EU",
                    "description": "EU actuator",
                    "quantity": 18,
                    "unit_price": 72.0,
                    "currency": "EUR",
                },
            ],
            5591.33,
            "EUR",
            14,
            "30 days EOM",
            "2024-05-31",
        ),
    },
    {
        "key": "sq-06",
        "filename": "halcyon_pricing_sheet_Q2.csv",
        "doc_type": DocumentType.supplier_quote,
        "source_format": SourceFormat.spreadsheet,
        "raw_content": """vendor,Halcyon Fasteners Ltd.
quote_id,HS-Q2-2024
sku,description,qty,unit_price,currency
HF-CAB-14/2,14/2 tray cable (1000 ft reel),4,385.00,USD
HF-CAB-CAT6,CAT6 plenum cable (305m box),12,124.50,USD
HF-CON-LC,LC duplex fiber coupler,200,2.15,USD
total_amount,6238.00
payment_terms,Net 30
validity_date,2024-07-01
lead_time_days,7
""",
        "ground_truth": _gt(
            "Halcyon Fasteners Ltd.",
            [
                {
                    "sku": "HF-CAB-14/2",
                    "description": "14/2 tray cable (1000 ft reel)",
                    "quantity": 4,
                    "unit_price": 385.0,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CAB-CAT6",
                    "description": "CAT6 plenum cable (305m box)",
                    "quantity": 12,
                    "unit_price": 124.5,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CON-LC",
                    "description": "LC duplex fiber coupler",
                    "quantity": 200,
                    "unit_price": 2.15,
                    "currency": "USD",
                },
            ],
            6238.0,
            "USD",
            7,
            "Net 30",
            "2024-07-01",
        ),
    },
    # --- 6 customer quote requests ---
    {
        "key": "cr-01",
        "filename": "riverside_rfq_structural_beams.pdf",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """RIVERSIDE INDUSTRIAL CONTRACTORS
Request for Quote — Structural steel

Project: Warehouse expansion Phase 2
Needed by: 2024-05-01

Please quote:
  - 48x W12x26 beams 20 ft (match prior PO NS-BEAM-240 if possible)
  - 24x 1/2" A36 plate 4x8

Deliver to: Dock 3, Riverside yard
Payment expectation: Net 45
""",
        "ground_truth": _gt(
            "Riverside Industrial Contractors",
            [
                {
                    "sku": "NS-BEAM-240",
                    "description": "W12x26 beams 20 ft",
                    "quantity": 48,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "NS-PLATE-12",
                    "description": '1/2" A36 plate 4x8',
                    "quantity": 24,
                    "unit_price": None,
                    "currency": "USD",
                },
            ],
            0.0,
            "USD",
            None,
            "Net 45",
            "2024-05-01",
            lead_time_required=False,
        ),
    },
    {
        "key": "cr-02",
        "filename": "apex_rfq_data_cabling.pdf",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """Apex Mechanical Services
RFQ #AM-2024-77 — Data hall cabling package

Need pricing for:
  HF-CAB-14/2 tray cable — 4 reels
  HF-CAB-CAT6 plenum — 12 boxes
  HF-CON-LC couplers — 200 pcs

Target install window: June 2024
Standard payment Net 30.
""",
        "ground_truth": _gt(
            "Apex Mechanical Services",
            [
                {
                    "sku": "HF-CAB-14/2",
                    "description": "tray cable reels",
                    "quantity": 4,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CAB-CAT6",
                    "description": "CAT6 plenum boxes",
                    "quantity": 12,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CON-LC",
                    "description": "LC duplex couplers",
                    "quantity": 200,
                    "unit_price": None,
                    "currency": "USD",
                },
            ],
            0.0,
            "USD",
            30,
            "Net 30",
            "2024-06-30",
        ),
    },
    {
        "key": "cr-03",
        "filename": "greenfield_valve_rfq_scan.pdf",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """[scan — handwritten margin notes]

Greenfield Utilities — RFQ scanned 12/Feb/24

Need quote for valve package:
  12 off 2" ball SS316  (MV-BV-2SS)
  6 off 4" gate flanged  (MV-GV-4FL)
  actuators x6 MV-ACT-01

Budget ballpark $6k but confirm.
No hard deadline — ASAP
""",
        "ground_truth": _gt(
            "Greenfield Utilities",
            [
                {
                    "sku": "MV-BV-2SS",
                    "description": '2" ball SS316',
                    "quantity": 12,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "MV-GV-4FL",
                    "description": '4" gate flanged',
                    "quantity": 6,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "MV-ACT-01",
                    "description": "actuators",
                    "quantity": 6,
                    "unit_price": None,
                    "currency": "USD",
                },
            ],
            6000.0,
            "USD",
            None,
            "ASAP",
            "2024-03-31",
            lead_time_required=False,
        ),
    },
    {
        "key": "cr-04",
        "filename": "fwd_thread_deck_materials.eml",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.email_body,
        "raw_content": """---------- Forwarded message ----------
From: site@riverside-contractors.com
Date: Mon, 4 Mar 2024 09:14

Mike — can you get Northbridge to re-quote the deck package?
We need the usual 2x6 treated plus posts. Last time bolts were HF-CB-38.

---------- Original ----------
From: j.smith@riverside-contractors.com
We are short ~120 boards and 60 posts for Pier 4.

Sent from iPhone
""",
        "ground_truth": _gt(
            "Riverside Industrial Contractors",
            [
                {
                    "sku": "NB-LUM-2X6-12",
                    "description": "usual 2x6 treated deck boards",
                    "quantity": 120,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "NB-LUM-4X4-8",
                    "description": "treated posts",
                    "quantity": 60,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CB-38",
                    "description": "carriage bolts (usual)",
                    "quantity": 500,
                    "unit_price": None,
                    "currency": "USD",
                },
            ],
            0.0,
            "USD",
            None,
            "Net 30",
            "2024-04-15",
            lead_time_required=False,
        ),
    },
    {
        "key": "cr-05",
        "filename": "urgent_fastener_rfq.eml",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.email_body,
        "raw_content": """From: maintenance@apexmechanical.com
Subject: URGENT — same as last month + extras

Need the usual M12 packs and double the M16s from Halcyon.
Also throw in HF-NUT-M12 like before.

Need by Friday. Net 30 is fine.
""",
        "ground_truth": _gt(
            "Apex Mechanical Services",
            [
                {
                    "sku": "HF-M12-80",
                    "description": "usual M12 packs",
                    "quantity": 40,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "HF-M16-100",
                    "description": "M16 (double last order)",
                    "quantity": 50,
                    "unit_price": None,
                    "currency": "USD",
                },
                {
                    "sku": "HF-NUT-M12",
                    "description": "M12 lock nuts like before",
                    "quantity": 40,
                    "unit_price": None,
                    "currency": "USD",
                },
            ],
            0.0,
            "USD",
            5,
            "Net 30",
            "2024-03-22",
        ),
    },
    {
        "key": "cr-06",
        "filename": "materials_takeoff_sheet.xlsx",
        "doc_type": DocumentType.customer_request,
        "source_format": SourceFormat.spreadsheet,
        "raw_content": """requester,Greenfield Utilities
project,DN50 valve upgrade
sku,description,qty
MV-BV-DN50,DN50 ball valve,18
MV-ACT-EU,EU actuator,18
currency,EUR
needed_by,2024-05-15
payment_terms,30 days EOM
""",
        "ground_truth": _gt(
            "Greenfield Utilities",
            [
                {
                    "sku": "MV-BV-DN50",
                    "description": "DN50 ball valve",
                    "quantity": 18,
                    "unit_price": None,
                    "currency": "EUR",
                },
                {
                    "sku": "MV-ACT-EU",
                    "description": "EU actuator",
                    "quantity": 18,
                    "unit_price": None,
                    "currency": "EUR",
                },
            ],
            0.0,
            "EUR",
            21,
            "30 days EOM",
            "2024-05-15",
        ),
    },
    # --- 6 purchase orders ---
    {
        "key": "po-01",
        "filename": "riverside_po_NS-2024-442.pdf",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """RIVERSIDE INDUSTRIAL CONTRACTORS
PURCHASE ORDER PO-NS-2024-442

Vendor: Northbridge Steel Co.
Reference quote: QT-2024-1187

Line items:
  NS-BEAM-240  W12x26 beam 20ft   Qty 48   USD 312.00
  NS-PLATE-12  1/2" plate 4x8    Qty 24   USD 189.50

Total: USD 21,374.00
Lead time: 21 business days
Payment: Net 45
Required delivery: 2024-05-20
""",
        "ground_truth": _gt(
            "Northbridge Steel Co.",
            [
                {
                    "sku": "NS-BEAM-240",
                    "description": "W12x26 beam 20ft",
                    "quantity": 48,
                    "unit_price": 312.0,
                    "currency": "USD",
                },
                {
                    "sku": "NS-PLATE-12",
                    "description": '1/2" plate 4x8',
                    "quantity": 24,
                    "unit_price": 189.5,
                    "currency": "USD",
                },
            ],
            21374.0,
            "USD",
            21,
            "Net 45",
            "2024-05-20",
        ),
    },
    {
        "key": "po-02",
        "filename": "apex_po_halcyon_HF-991.pdf",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """Apex Mechanical Services — Purchase Order HF-991

Supplier: Halcyon Fasteners Ltd.
Per quote FQ-8821

HF-M12-80   qty 40 @ 28.40
HF-M16-100  qty 25 @ 41.20
HF-NUT-M12  qty 40 @ 19.85

Order total USD 2,469.25 | Net 30 | Deliver within 10 working days
""",
        "ground_truth": _gt(
            "Halcyon Fasteners Ltd.",
            [
                {
                    "sku": "HF-M12-80",
                    "description": "M12x80 hex bolt pack",
                    "quantity": 40,
                    "unit_price": 28.4,
                    "currency": "USD",
                },
                {
                    "sku": "HF-M16-100",
                    "description": "M16x100 bolt pack",
                    "quantity": 25,
                    "unit_price": 41.2,
                    "currency": "USD",
                },
                {
                    "sku": "HF-NUT-M12",
                    "description": "M12 lock nut pack",
                    "quantity": 40,
                    "unit_price": 19.85,
                    "currency": "USD",
                },
            ],
            2469.25,
            "USD",
            10,
            "Net 30",
            "2024-04-10",
        ),
    },
    {
        "key": "po-03",
        "filename": "greenfield_po_meridian_MV-220.pdf",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.native_pdf,
        "raw_content": """Greenfield Utilities
PO MV-220 — Meridian Valves

Items per QT-4402:
  MV-BV-2SS  12 @ 184.00
  MV-GV-4FL   6 @ 412.50
  MV-ACT-01   6 @  89.00

Total USD 5,892.00
Payment Net 30
""",
        "ground_truth": _gt(
            "Meridian Valves",
            [
                {
                    "sku": "MV-BV-2SS",
                    "description": "Ball valve 2 SS316",
                    "quantity": 12,
                    "unit_price": 184.0,
                    "currency": "USD",
                },
                {
                    "sku": "MV-GV-4FL",
                    "description": "Gate valve 4 flanged",
                    "quantity": 6,
                    "unit_price": 412.5,
                    "currency": "USD",
                },
                {
                    "sku": "MV-ACT-01",
                    "description": "Actuator kit",
                    "quantity": 6,
                    "unit_price": 89.0,
                    "currency": "USD",
                },
            ],
            5892.0,
            "USD",
            21,
            "Net 30",
            "2024-04-25",
        ),
    },
    {
        "key": "po-04",
        "filename": "riverside_po_lumber_scan.pdf",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """[scanned PO — Riverside Industrial]

PO LUM-04  to Northbridge Steel Co.
Deck package per quote LQ-09

120 boards 2x6x12 treated (~47.25)
60 posts 4x4x8 (~112.00)
500 bolts HF-CB-38 @ 0.85

Total per quote about $18,200 — please confirm freight.
Payment Net 30.
""",
        "ground_truth": _gt(
            "Northbridge Steel Co.",
            [
                {
                    "sku": "NB-LUM-2X6-12",
                    "description": "2x6x12 treated boards",
                    "quantity": 120,
                    "unit_price": 47.25,
                    "currency": "USD",
                },
                {
                    "sku": "NB-LUM-4X4-8",
                    "description": "4x4x8 treated posts",
                    "quantity": 60,
                    "unit_price": 112.0,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CB-38",
                    "description": "carriage bolts",
                    "quantity": 500,
                    "unit_price": 0.85,
                    "currency": "USD",
                },
            ],
            18200.0,
            "USD",
            15,
            "Net 30",
            "2024-06-15",
        ),
    },
    {
        "key": "po-05",
        "filename": "apex_po_cabling_scan.pdf",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.scanned_pdf,
        "raw_content": """[fax scan — Apex Mechanical PO]

Halcyon Fasteners — cabling order HS-Q2-2024

14/2 tray 4 reels @ three eighty-five
CAT6 plenum 12 bx @ 124.50
LC couplers 200 @ 2.15

Total written as 6238 USD
7 day lead. Net 30.
""",
        "ground_truth": _gt(
            "Halcyon Fasteners Ltd.",
            [
                {
                    "sku": "HF-CAB-14/2",
                    "description": "14/2 tray cable reel",
                    "quantity": 4,
                    "unit_price": 385.0,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CAB-CAT6",
                    "description": "CAT6 plenum box",
                    "quantity": 12,
                    "unit_price": 124.5,
                    "currency": "USD",
                },
                {
                    "sku": "HF-CON-LC",
                    "description": "LC duplex coupler",
                    "quantity": 200,
                    "unit_price": 2.15,
                    "currency": "USD",
                },
            ],
            6238.0,
            "USD",
            7,
            "Net 30",
            "2024-07-15",
        ),
    },
    {
        "key": "po-06",
        "filename": "greenfield_po_meridian_eu_email.eml",
        "doc_type": DocumentType.purchase_order,
        "source_format": SourceFormat.email_body,
        "raw_content": """From: procurement@greenfield-utilities.com
To: quotes@meridian-valves.eu
Subject: PO confirmation — DN50 package

Please proceed with PO per your 31/05 offer:
  18x MV-BV-DN50 @ EUR 198.50 (Tier 2)
  18x MV-ACT-EU @ EUR 72.00

Total gross EUR 5,591.33 incl. VAT.
Payment 30 days EOM. Ship ASAP.
""",
        "ground_truth": _gt(
            "Meridian Valves",
            [
                {
                    "sku": "MV-BV-DN50",
                    "description": "DN50 ball valve Tier 2",
                    "quantity": 18,
                    "unit_price": 198.5,
                    "currency": "EUR",
                },
                {
                    "sku": "MV-ACT-EU",
                    "description": "EU actuator",
                    "quantity": 18,
                    "unit_price": 72.0,
                    "currency": "EUR",
                },
            ],
            5591.33,
            "EUR",
            14,
            "30 days EOM",
            "2024-06-30",
        ),
    },
]
