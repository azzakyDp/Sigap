"""
Model ReportStatusHistory SIGAP Backend.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ReportStatus

if TYPE_CHECKING:
    from app.models.report import Report
    from app.models.user import User


class ReportStatusHistory(Base):
    __tablename__ = "report_status_histories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    status_from: Mapped[ReportStatus | None] = mapped_column(
        Enum(ReportStatus, native_enum=False),
        nullable=True,
    )
    status_to: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, native_enum=False),
        nullable=False,
    )
    changed_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
    catatan: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    report: Mapped["Report"] = relationship("Report", back_populates="status_histories")
    user: Mapped["User"] = relationship("User", foreign_keys=[changed_by])
