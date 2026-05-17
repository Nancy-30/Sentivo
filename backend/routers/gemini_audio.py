import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import AnalysisResult, ErrorResponse
from services.gemini_audio_service import analyze_audio

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
    if file.content_type not in _ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported media type '{file.content_type}'. "
                f"Accepted: {sorted(_ALLOWED_MIME_TYPES)}"
            ),
        )

    audio_bytes = await file.read()
    if len(audio_bytes) > _MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 100 MB limit")

    try:
        return await analyze_audio(audio_bytes, file.content_type)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
