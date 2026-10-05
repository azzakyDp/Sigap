"""
Model ActionReport SIGAP Backend.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.report import Report
    from app.models.user import User


class ActionReport(Base):
    __tablename__ = "action_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    jenis_tindakan: Mapped[str] = mapped_column(String(255), nullable=False)
    deskripsi: Mapped[str] = mapped_column(Text, nullable=False)
    waktu_kedatangan: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    waktu_selesai: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    hasil: Mapped[str] = mapped_column(Text, nullable=False)
    dokumentasi: Mapped[Any | None] = mapped_column(JSON, nullable=True)
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
    report: Mapped["Report"] = relationship("Report", back_populates="action_reports")
    officer: Mapped["User"] = relationship("User", foreign_keys=[officer_id])
