"""
Router Kategori Master Data (GET /api/v1/categories).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.category import ReportCategoryResponse
from app.services.report_service import ReportService

router = APIRouter(prefix="/categories", tags=["Categories"])
report_service = ReportService()


@router.get(
    "",
    response_model=list[ReportCategoryResponse],
    summary="Mendapatkan daftar kategori pengaduan aktif dan field dinamisnya",
)
def get_categories(db: Session = Depends(get_db)) -> list[ReportCategoryResponse]:
    """Mendapatkan seluruh master kategori pengaduan aktif beserta kriteria field dinamisnya."""
    return report_service.get_categories(db)
