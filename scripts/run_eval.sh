#!/usr/bin/env bash
# Full ExtractBench pipeline: seed database → run all extractions → print summary.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="${REPO_ROOT}/apps/api"

cd "${API_DIR}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "Error: OPENAI_API_KEY is not set."
  echo "  cp apps/api/.env.example apps/api/.env"
  echo "  # then add your key"
  exit 1
fi

echo "==> Seeding database..."
python3 scripts/seed.py

echo ""
echo "==> Running extractions (this calls the OpenAI API)..."
python3 scripts/run_eval.py

echo ""
echo "Done. Start the API and web app:"
echo "  cd apps/api && uvicorn main:app --reload"
echo "  cd apps/web && npm run dev"
