#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Sentivo — single-command dev startup
#
# Usage:  ./start.sh
#
# What it does (in order):
#   1. Verifies backend/.env exists
#   2. Creates / activates a Python venv
#   3. Installs Python dependencies
#   4. Installs Node dependencies and builds the React frontend
#   5. Starts the FastAPI backend (which serves the built frontend)
#
# App is available at: http://localhost:8000
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

step()  { echo -e "\n${BLUE}${BOLD}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✔ $*${NC}"; }
warn()  { echo -e "${YELLOW}⚠ $*${NC}"; }
fatal() { echo -e "${RED}✖ $*${NC}" >&2; exit 1; }

# ── Resolve absolute paths ────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
VENV="$ROOT/venv"

echo -e "\n${BOLD}Sentivo — starting up${NC}"
echo "────────────────────────────────────────"

# ── 1. Check .env ─────────────────────────────────────────────────────────────
step "Checking environment"

if [ ! -f "$BACKEND/.env" ]; then
  fatal "backend/.env not found.\n\n  Copy the example and fill in your key:\n    cp backend/.env.example backend/.env\n  Then set GEMINI_API_KEY inside it."
fi

if ! grep -q "GEMINI_API_KEY" "$BACKEND/.env" || grep -q "GEMINI_API_KEY=your_gemini" "$BACKEND/.env"; then
  warn "GEMINI_API_KEY looks unset in backend/.env — the app will start but Gemini calls will fail."
fi

ok "backend/.env found"

# ── 2. Python venv ────────────────────────────────────────────────────────────
step "Setting up Python environment"

# Find python3 or python
PYTHON=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then
    PYTHON="$cmd"
    break
  fi
done
[ -z "$PYTHON" ] && fatal "Python not found. Install Python 3.9+ and try again."

if [ ! -d "$VENV" ]; then
  echo "Creating virtual environment…"
  "$PYTHON" -m venv "$VENV"
fi

# Windows (Git Bash / MSYS2) uses Scripts\activate; Linux and macOS use bin/activate
# shellcheck disable=SC1091
if [ -f "$VENV/Scripts/activate" ]; then
  source "$VENV/Scripts/activate"
elif [ -f "$VENV/bin/activate" ]; then
  source "$VENV/bin/activate"
else
  fatal "venv activation script not found. Delete the venv/ folder and re-run."
fi
ok "Virtual environment active  ($(python --version))"

# ── 3. Python dependencies ────────────────────────────────────────────────────
step "Installing Python dependencies"
python -m pip install --quiet --upgrade pip
pip install --quiet -r "$BACKEND/requirements.txt"
ok "Python dependencies installed"

# ── 4. Frontend — install & build ─────────────────────────────────────────────
step "Building frontend"

command -v node &>/dev/null || fatal "Node.js not found. Install Node 18+ and try again."
command -v npm  &>/dev/null || fatal "npm not found. Install Node 18+ and try again."

cd "$FRONTEND"

# Use ci for reproducible installs when package-lock.json exists, otherwise install
npm install

npm run build   # outputs to ../backend/static (set in vite.config.js)
ok "Frontend built → backend/static/"

# ── 5. Start backend ──────────────────────────────────────────────────────────
step "Starting backend"
cd "$BACKEND"

PORT="${PORT:-8000}"
echo ""
echo -e "  ${BOLD}App:${NC}    http://localhost:$PORT"
echo -e "  ${BOLD}API:${NC}    http://localhost:$PORT/api/gemini/analyze"
echo -e "  ${BOLD}Docs:${NC}   http://localhost:$PORT/docs"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop."
echo ""

exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --reload
