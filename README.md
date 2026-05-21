# ExtractBench

An evaluation harness for structured extraction from messy real-world documents.

## Apps

### Web (`apps/web`)

```bash
cd apps/web && npm run dev
```

Runs the Next.js frontend at [http://localhost:3000](http://localhost:3000).

### API (`apps/api`)

```bash
cd apps/api && uvicorn main:app --reload
```

Runs the FastAPI backend at [http://localhost:8000](http://localhost:8000).
