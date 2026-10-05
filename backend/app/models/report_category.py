"""
Model ReportCategory SIGAP Backend.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ReportPriority

if TYPE_CHECKING:
    from app.models.category_field import CategoryField


class ReportCategory(Base):
    __tablename__ = "report_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nama_kategori: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    default_priority: Mapped[ReportPriority] = mapped_column(
        Enum(ReportPriority, native_enum=False),
        nullable=False,
        default=ReportPriority.MEDIUM,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
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
    fields: Mapped[list["CategoryField"]] = relationship(
        "CategoryField",
        back_populates="category",
        cascade="all, delete-orphan",
    )
