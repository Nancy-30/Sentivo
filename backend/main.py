import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from starlette.responses import Response
from fastapi.staticfiles import StaticFiles

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from routers.gemini_audio import router as gemini_audio_router

app = FastAPI(
    title="Call Intelligence API",
    description="Sends audio directly to Google Gemini for transcription, intent, and sentiment analysis.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ────────────────────────────────────────────────────────────────
app.include_router(gemini_audio_router)


@app.get("/health", tags=["meta"])
async def health() -> dict:
    return {
        "status": "ok",
        "gemini_key_set": bool(os.getenv("GEMINI_API_KEY")),
    }


# ── Static files (React build) ────────────────────────────────────────────────
# `frontend/vite.config.js` sets outDir to `../backend/static`, so after
# `npm run build` the compiled assets live alongside this file.
_STATIC_DIR = Path(__file__).parent / "static"

if (_STATIC_DIR / "assets").exists():
    # Serve hashed JS/CSS bundles at /assets/* with aggressive caching
    app.mount(
        "/assets",
        StaticFiles(directory=str(_STATIC_DIR / "assets")),
        name="static-assets",
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str) -> Response:
    """Serve real static files that exist; fall back to index.html for SPA routing."""
    if _STATIC_DIR.exists():
        # Serve any root-level public files (favicon.ico, robots.txt, …)
        candidate = _STATIC_DIR / full_path
        if full_path and candidate.exists() and candidate.is_file():
            return FileResponse(str(candidate))
        # All other paths → React handles routing client-side
        index = _STATIC_DIR / "index.html"
        if index.exists():
            return FileResponse(str(index))

    return PlainTextResponse(
        "Frontend not built. Run: cd frontend && npm run build",
        status_code=404,
    )
