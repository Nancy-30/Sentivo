from pydantic import BaseModel
from typing import Optional


class SpeakerSegment(BaseModel):
    speaker: str
    text: str
    start: float
    end: float


class TranscriptResult(BaseModel):
    full_text: str
    segments: list[SpeakerSegment]
    speakers_detected: int
    duration_seconds: float


class IntentItem(BaseModel):
    intent: str
    confidence: float
    description: str


class IntentResult(BaseModel):
    primary_intent: str
    intents: list[IntentItem]
    summary: str


class SpeakerSentiment(BaseModel):
    speaker: str
    sentiment: str
    score: float
    key_phrases: list[str]


class SentimentProgression(BaseModel):
    segment_index: int
    speaker: str
    text_snippet: str
    sentiment: str
    score: float


class SentimentResult(BaseModel):
    overall_sentiment: str
    overall_score: float
    speaker_sentiments: list[SpeakerSentiment]
    progression: list[SentimentProgression]
    summary: str


class AnalysisResult(BaseModel):
    transcript: TranscriptResult
    intent: IntentResult
    sentiment: SentimentResult


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
