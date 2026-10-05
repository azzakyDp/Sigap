"""
Model AIAnalysis SIGAP Backend.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AIAnalysisStatus, ReportPriority

if TYPE_CHECKING:
    from app.models.report import Report


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    analysis_type: Mapped[str] = mapped_column(String(100), nullable=False)
    suggested_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    suggested_priority: Mapped[ReportPriority | None] = mapped_column(
        Enum(ReportPriority, native_enum=False),
        nullable=True,
    )
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    warnings: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    needs_human_review: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[AIAnalysisStatus] = mapped_column(
        Enum(AIAnalysisStatus, native_enum=False),
        nullable=False,
        default=AIAnalysisStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    report: Mapped["Report"] = relationship("Report", back_populates="ai_analyses")
