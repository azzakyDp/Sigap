"""
Model ReportAssignment SIGAP Backend.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.report import Report
    from app.models.user import User


class ReportAssignment(Base):
    __tablename__ = "report_assignments"
    __table_args__ = (
        Index("ix_report_assignments_report_id_is_current", "report_id", "is_current"),
        Index("ix_report_assignments_officer_id_is_current", "officer_id", "is_current"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
    )
    officer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    report: Mapped["Report"] = relationship("Report", back_populates="assignments")
    officer: Mapped["User"] = relationship("User", foreign_keys=[officer_id])
    assigner: Mapped["User"] = relationship("User", foreign_keys=[assigned_by])
