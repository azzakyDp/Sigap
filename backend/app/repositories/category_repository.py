"""
Repository layer untuk ReportCategory dan CategoryField.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.category_field import CategoryField
from app.models.report_category import ReportCategory


class CategoryRepository:
    """Metode akses data untuk master kategori pengaduan."""

    @staticmethod
    def get_active_categories(db: Session) -> list[ReportCategory]:
        """Mengambil seluruh kategori aktif beserta field dinamisnya."""
        stmt = (
            select(ReportCategory)
            .where(ReportCategory.is_active.is_(True))
            .options(joinedload(ReportCategory.fields))
            .order_by(ReportCategory.id.asc())
        )
        return list(db.scalars(stmt).unique().all())

    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> ReportCategory | None:
        """Mengambil 1 kategori berdasarkan ID."""
        stmt = (
            select(ReportCategory)
            .where(ReportCategory.id == category_id)
            .options(joinedload(ReportCategory.fields))
        )
        return db.scalar(stmt)
