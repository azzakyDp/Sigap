"""
Model Report SIGAP Backend.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ReportPriority, ReportStatus

if TYPE_CHECKING:
    from app.models.action_report import ActionReport
    from app.models.ai_analysis import AIAnalysis
    from app.models.report_assignment import ReportAssignment
    from app.models.report_category import ReportCategory
    from app.models.report_evidence import ReportEvidence
    from app.models.report_field_value import ReportFieldValue
    from app.models.report_status_history import ReportStatusHistory
    from app.models.user import User


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nomor_laporan: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    citizen_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("report_categories.id"), nullable=False)
    deskripsi: Mapped[str] = mapped_column(Text, nullable=False)
    waktu_kejadian: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    alamat_lokasi: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, native_enum=False),
        nullable=False,
        default=ReportStatus.PENDING_VERIFICATION,
    )
    priority: Mapped[ReportPriority] = mapped_column(
        Enum(ReportPriority, native_enum=False),
        nullable=False,
        default=ReportPriority.MEDIUM,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    citizen: Mapped["User"] = relationship("User", foreign_keys=[citizen_id])
    category: Mapped["ReportCategory"] = relationship("ReportCategory")
    field_values: Mapped[list["ReportFieldValue"]] = relationship(
        "ReportFieldValue",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    evidences: Mapped[list["ReportEvidence"]] = relationship(
        "ReportEvidence",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    status_histories: Mapped[list["ReportStatusHistory"]] = relationship(
        "ReportStatusHistory",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    assignments: Mapped[list["ReportAssignment"]] = relationship(
        "ReportAssignment",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    action_reports: Mapped[list["ActionReport"]] = relationship(
        "ActionReport",
        back_populates="report",
        cascade="all, delete-orphan",
    )
    ai_analyses: Mapped[list["AIAnalysis"]] = relationship(
        "AIAnalysis",
        back_populates="report",
        cascade="all, delete-orphan",
    )
