import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from models.schemas import AnalysisResult, ErrorResponse
from services.gemini_audio_service import analyze_audio, analyze_audio_stream

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gemini", tags=["gemini-direct"])

_ALLOWED_MIME_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    "audio/aac",
    "audio/x-m4a",
}

_MAX_FILE_BYTES = 100 * 1024 * 1024  # 100 MB


def _normalize_mime(content_type: str | None) -> str:
    """Strip codec suffix so 'audio/webm;codecs=opus' matches as 'audio/webm'."""
    return (content_type or "").split(";")[0].strip().lower()


def _validate(file: UploadFile) -> str:
    mime = _normalize_mime(file.content_type)
    if mime not in _ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported media type '{file.content_type}'. "
                f"Accepted: {sorted(_ALLOWED_MIME_TYPES)}"
            ),
        )
    return mime


@router.post(
    "/analyze",
    response_model=AnalysisResult,
    responses={
        415: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
    summary="Analyze audio directly with Gemini (no ASR layer)",
    description=(
        "Upload an audio file. Gemini transcribes the conversation, infers speaker turns, "
        "and returns intent + sentiment — all in a single API call with no intermediate ASR service."
    ),
)
async def analyze_audio_direct(file: UploadFile = File(...)) -> AnalysisResult:
    mime = _validate(file)
    audio_bytes = await file.read()
    if len(audio_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 100 MB limit")
    try:
        return await analyze_audio(audio_bytes, mime)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post(
    "/analyze/stream",
    responses={
        415: {"model": ErrorResponse},
        413: {"model": ErrorResponse},
    },
    summary="Stream Gemini audio analysis via Server-Sent Events",
    description=(
        "Upload an audio file (or recorded blob). Returns a text/event-stream with progress "
        "status events and a final 'complete' event containing the full AnalysisResult JSON."
    ),
)
async def analyze_audio_stream_endpoint(file: UploadFile = File(...)) -> StreamingResponse:
    mime = _validate(file)
    audio_bytes = await file.read()
    if len(audio_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 100 MB limit")

    return StreamingResponse(
        analyze_audio_stream(audio_bytes, mime),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
