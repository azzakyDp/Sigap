"""
Schema output AI Assistant & API SIGAP.

Prinsip (AI Requirements §2): "AI memberikan rekomendasi, manusia
memberikan keputusan." Field di bawah ini karena itu SELALU bernama
`suggested_*`, bukan `final_*`.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import AIAnalysisStatus, ReportPriority


class AnalysisType(str, Enum):
    CATEGORY_PRIORITY_SUGGESTION = "CATEGORY_PRIORITY_SUGGESTION"


class AIAnalysisResult(BaseModel):
    """
    Struktur output AI Provider — mengikuti AI Requirements SIGAP §7.
    """

    model_name: str
    analysis_type: AnalysisType
    suggested_category: str | None = None
    suggested_priority: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str
    evidence: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    needs_human_review: bool = True

    @field_validator("suggested_priority")
    @classmethod
    def validate_suggested_priority(cls, v: str | None) -> str | None:
        if v is not None:
            allowed = {p.value for p in ReportPriority}
            if v not in allowed:
                raise ValueError(f"Priority '{v}' tidak valid. Harus salah satu dari {allowed}")
        return v


class AIAnalysisResponse(AIAnalysisResult):
    """
    Schema response API untuk endpoint /reports/{id}/ai-analysis.
    Membungkus AIAnalysisResult dengan metadata database.
    """

    id: int
    report_id: int
    status: AIAnalysisStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
