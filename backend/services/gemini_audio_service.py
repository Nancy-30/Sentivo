import asyncio
import io
import json
import logging
import os
import re

import google.generativeai as genai

from models.schemas import (
    AnalysisResult,
    IntentItem,
    IntentResult,
    SentimentProgression,
    SentimentResult,
    SpeakerSegment,
    SpeakerSentiment,
    TranscriptResult,
)

logger = logging.getLogger(__name__)

_ANALYSIS_PROMPT = """You are an expert call intelligence analyst. Listen to this audio recording carefully.

Perform ALL of the following and return ONLY a valid JSON object — no markdown fences, no extra text:

1. Transcribe the entire conversation. Identify each distinct speaker as "Speaker 1", "Speaker 2", etc.
2. Detect the intent of the call.
3. Analyze the sentiment of each speaker and the overall conversation.

Return this exact JSON structure:

{
  "transcript": {
    "full_text": "<complete transcript as a single readable string>",
    "segments": [
      {
        "speaker": "<Speaker 1 | Speaker 2 | ...>",
        "text": "<what this speaker said in this segment>",
        "start": <approximate start time in seconds, float>,
        "end": <approximate end time in seconds, float>
      }
    ],
    "speakers_detected": <number of distinct speakers, integer>,
    "duration_seconds": <total audio duration in seconds, float>
  },
  "intent": {
    "primary_intent": "<concise label for the dominant intent>",
    "intents": [
      {
        "intent": "<intent label>",
        "confidence": <0.0 to 1.0>,
        "description": "<one sentence explaining this intent>"
      }
    ],
    "summary": "<2-3 sentence plain-English summary of what the call is about>"
  },
  "sentiment": {
    "overall_sentiment": "<positive|neutral|negative>",
    "overall_score": <-1.0 to 1.0>,
    "speaker_sentiments": [
      {
        "speaker": "<speaker label>",
        "sentiment": "<positive|neutral|negative>",
        "score": <-1.0 to 1.0>,
        "key_phrases": ["<phrase that most reveals their sentiment>"]
      }
    ],
    "progression": [
      {
        "segment_index": <integer starting from 0>,
        "speaker": "<speaker label>",
        "text_snippet": "<first ~10 words of the segment>",
        "sentiment": "<positive|neutral|negative>",
        "score": <-1.0 to 1.0>
      }
    ],
    "summary": "<2-3 sentence narrative of the emotional arc of the conversation>"
  }
}

Intent label examples: Product Inquiry, Technical Support, Billing Dispute, Cancellation Request,
Complaint, Demo Request, Onboarding Help, General Inquiry, Sales Pitch, Feedback.
overall_score: 1.0 = very positive, 0.0 = neutral, -1.0 = very negative.
If only one speaker is audible, label them "Speaker 1" throughout.
"""


def _get_model() -> genai.GenerativeModel:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    genai.configure(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    return genai.GenerativeModel(model_name)


def _extract_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
    return json.loads(text)


def _build_result(data: dict) -> AnalysisResult:
    t = data.get("transcript", {})
    segments = [
        SpeakerSegment(
            speaker=s["speaker"],
            text=s["text"],
            start=float(s.get("start", 0.0)),
            end=float(s.get("end", 0.0)),
        )
        for s in t.get("segments", [])
    ]
    transcript = TranscriptResult(
        full_text=t.get("full_text", ""),
        segments=segments,
        speakers_detected=int(t.get("speakers_detected", 1)),
        duration_seconds=float(t.get("duration_seconds", 0.0)),
    )

    i = data.get("intent", {})
    intents = [
        IntentItem(
            intent=item["intent"],
            confidence=float(item["confidence"]),
            description=item.get("description", ""),
        )
        for item in i.get("intents", [])
    ]
    intent = IntentResult(
        primary_intent=i.get("primary_intent", intents[0].intent if intents else "Unknown"),
        intents=intents,
        summary=i.get("summary", ""),
    )

    s = data.get("sentiment", {})
    speaker_sentiments = [
        SpeakerSentiment(
            speaker=ss["speaker"],
            sentiment=ss["sentiment"],
            score=float(ss["score"]),
            key_phrases=ss.get("key_phrases", []),
        )
        for ss in s.get("speaker_sentiments", [])
    ]
    progression = [
        SentimentProgression(
            segment_index=int(p["segment_index"]),
            speaker=p["speaker"],
            text_snippet=p.get("text_snippet", ""),
            sentiment=p["sentiment"],
            score=float(p["score"]),
        )
        for p in s.get("progression", [])
    ]
    sentiment = SentimentResult(
        overall_sentiment=s.get("overall_sentiment", "neutral"),
        overall_score=float(s.get("overall_score", 0.0)),
        speaker_sentiments=speaker_sentiments,
        progression=progression,
        summary=s.get("summary", ""),
    )

    return AnalysisResult(transcript=transcript, intent=intent, sentiment=sentiment)


async def analyze_audio(audio_bytes: bytes, mime_type: str) -> AnalysisResult:
    """Send audio directly to Gemini; returns transcript, intent, and sentiment in one call."""
    model = _get_model()

    uploaded_file = await asyncio.to_thread(
        genai.upload_file,
        io.BytesIO(audio_bytes),
        mime_type=mime_type,
        display_name="audio_upload",
    )

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            [uploaded_file, _ANALYSIS_PROMPT],
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )
        data = _extract_json(response.text)
        return _build_result(data)
    except json.JSONDecodeError as e:
        logger.error("Gemini audio JSON parse error: %s\nRaw: %s", e, response.text)
        raise RuntimeError("Audio analysis returned malformed JSON") from e
    except Exception as e:
        logger.error("Gemini audio analysis failed: %s", e)
        raise RuntimeError(f"Audio analysis failed: {e}") from e
    finally:
        try:
            await asyncio.to_thread(genai.delete_file, uploaded_file.name)
        except Exception:
            pass


async def analyze_audio_stream(audio_bytes: bytes, mime_type: str):
    """Async generator that yields SSE-formatted strings, streaming progress during analysis."""

    def _sse(event: dict) -> str:
        return f"data: {json.dumps(event)}\n\n"

    model = _get_model()
    uploaded_file = None

    try:
        yield _sse({"type": "status", "message": "Uploading audio to Gemini…"})

        uploaded_file = await asyncio.to_thread(
            genai.upload_file,
            io.BytesIO(audio_bytes),
            mime_type=mime_type,
            display_name="audio_upload",
        )

        yield _sse({"type": "status", "message": "Analyzing — transcribing, detecting speakers, extracting intent & sentiment…"})

        response = await asyncio.to_thread(
            model.generate_content,
            [uploaded_file, _ANALYSIS_PROMPT],
            generation_config=genai.GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json",
            ),
        )

        yield _sse({"type": "status", "message": "Processing results…"})

        data = _extract_json(response.text)
        result = _build_result(data)
        yield _sse({"type": "complete", "data": result.model_dump()})

    except json.JSONDecodeError as e:
        logger.error("Gemini stream JSON parse error: %s", e)
        yield _sse({"type": "error", "message": "Audio analysis returned malformed JSON"})
    except Exception as e:
        logger.error("Gemini stream analysis failed: %s", e)
        yield _sse({"type": "error", "message": f"Audio analysis failed: {e}"})
    finally:
        if uploaded_file:
            try:
                await asyncio.to_thread(genai.delete_file, uploaded_file.name)
            except Exception:
                pass
