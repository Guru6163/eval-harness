# ExtractBench

A small evaluation harness that measures how reliably LLMs extract structured procurement fields from messy business documents.

## Why this exists

Production extraction is not a single prompt problem. Real inputs arrive as scanned PDFs, forwarded email threads, and spreadsheet exports where prices sit in prose, currencies mix, and “the usual” SKUs never appear verbatim. Without a repeatable eval loop, teams ship on anecdotal wins and discover failure modes only after customers do.

An eval harness turns extraction into something you can regression-test. You define ground truth per field, run the same model across a fixed corpus, score outcomes with explicit rules, and compare runs over time. That makes it possible to justify model choices, catch regressions when prompts change, and prioritize engineering work on the formats that actually hurt accuracy.

ExtractBench is a minimal reference implementation of that loop: eighteen synthetic documents, seven scored fields, OpenAI-based extraction, and a simple web dashboard for results.

## How it works

1. **Documents** — Eighteen plain-text fixtures (supplier quotes, customer RFQs, purchase orders) with deliberate messiness: OCR noise, tiered pricing, VAT in prose, ambiguous references.
2. **Ground truth** — Per-document expected values for `vendor_name`, `line_items`, `total_amount`, `currency`, `lead_time_days`, `payment_terms`, and `validity_date`.
3. **Extraction** — GPT-4o (`gpt-4o`) returns JSON matching a strict schema; runs are stored with latency and estimated cost.
4. **Scoring** — Field-level rules (exact match, fuzzy strings, tolerance on amounts and lead times, per-line-item checks) produce scores and match types.
5. **Analysis** — The Next.js app aggregates accuracy by document type and field, with per-document expected-vs-extracted views.

## Running locally

**Prerequisites:** Node 20+, Python 3.11+, an [OpenAI API key](https://platform.openai.com/api-keys).

```bash
# 1. API setup
cd apps/api
cp .env.example .env          # add OPENAI_API_KEY
pip install -e .                # or: uv sync

# 2. Full eval pipeline (seed + extract all + summary)
cd ../..
./scripts/run_eval.sh

# 3. Start API (if not already running)
cd apps/api && uvicorn main:app --reload

# 4. Web dashboard
cd apps/web
cp .env.example .env.local      # optional; defaults to http://localhost:8000
npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API health: [http://localhost:8000/health](http://localhost:8000/health).

To run extraction for a single document:

```bash
curl -X POST http://localhost:8000/api/runs/{document_id}
```

## Tech choices

| Choice | Rationale |
|--------|-----------|
| **GPT-4o** | Strong structured-output quality and native JSON mode; widely available and predictable for document extraction evals. |
| **SQLite** | Zero-ops persistence; recipients can clone, run, and inspect `extractbench.db` without Docker or Postgres. |
| **FastAPI** | Thin API layer with automatic OpenAPI docs and straightforward SQLAlchemy integration. |
| **Next.js 15 (App Router)** | Client pages fetch eval results from the public API URL in the browser (`NEXT_PUBLIC_API_URL`). |
| **Deterministic scoring** | Rules-based comparison keeps evals reproducible and explainable; no second LLM judge required. |
| **Plain-text fixtures** | Skips PDF generation while still modeling OCR scans, emails, and spreadsheets as extracted text. |

## What I'd build next if this were production

<!-- EDIT BEFORE SENDING -->

[Placeholder — describe production follow-ups: layout-aware PDF ingestion, human review queue for partial extractions, per-format model routing, calibration dashboards by customer segment, and CI gates on field-level accuracy before prompt deploys.]

## About the demo data

All documents in ExtractBench are **synthetic**. They are modeled on real patterns observed in **[industry]** research and common B2B quoting workflows (multi-line SKUs, payment terms, validity windows, format-specific failure modes). No customer data, company names, or live contracts are included. Fictional vendors (e.g. Northbridge Steel, Halcyon Fasteners, Meridian Valves) are used throughout.

## Deploying

### Web (Vercel)

1. Import the repo and set the root directory to `apps/web`.
2. Add environment variable:
   - `NEXT_PUBLIC_API_URL` — public URL of the deployed API (e.g. `https://your-api.fly.dev`).
3. Deploy. The app is server-rendered and fetches the API at request time.

### API (Railway or Fly.io)

1. Deploy `apps/api` with Python 3.11.
2. Set environment variables:
   - `OPENAI_API_KEY` — required for extractions.
   - `CORS_ORIGINS` — optional comma-separated frontend origins (default `http://localhost:3000`). The API also allows `*.vercel.app` and `*.up.railway.app` via `CORS_ORIGIN_REGEX` so Vercel/Railway deploys work without extra config; set `CORS_ORIGINS` if you use a custom domain.
3. Start command (configured in `apps/api/railway.json`): seeds documents when the DB is empty, then starts the API.
4. Run extractions once (SSH or one-off job) if you want scored results in the dashboard:
   ```bash
   python scripts/run_eval.py
   ```
5. Persist the `extractbench.db` volume between deploys if you want scores to survive restarts. Set `SEED_RESET=1` on Railway to wipe and reseed documents on every deploy.

See `.env.example` at the repo root for all variables.

## Repository layout

```
apps/web/          Next.js dashboard
apps/api/          FastAPI + SQLAlchemy + extraction/scoring
scripts/           run_eval.sh — full local pipeline
```
