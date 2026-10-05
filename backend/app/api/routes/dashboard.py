"""
Router Endpoint Dashboard & Agregasi Verifier/Admin (Phase 8).
"""

from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    DashboardTrendResponse,
    PaginatedNeedsAttentionResponse,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Mendapatkan ringkasan statistik laporan per status, prioritas, & needs attention",
)
def get_dashboard_summary(
    start_date: datetime | None = Query(None, description="Filter rentang tanggal awal (ISO format)"),
    end_date: datetime | None = Query(None, description="Filter rentang tanggal akhir (ISO format)"),
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    return DashboardService.get_summary(db=db, start_date=start_date, end_date=end_date)


@router.get(
    "/trend",
    response_model=DashboardTrendResponse,
    summary="Mendapatkan tren jumlah laporan masuk per hari atau minggu",
)
def get_dashboard_trend(
    granularity: Literal["daily", "weekly"] = Query("daily", description="Granularitas tren ('daily' | 'weekly')"),
    start_date: date | None = Query(None, description="Filter tanggal awal (YYYY-MM-DD)"),
    end_date: date | None = Query(None, description="Filter tanggal akhir (YYYY-MM-DD)"),
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> DashboardTrendResponse:
    return DashboardService.get_trend(
        db=db,
        granularity=granularity,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/needs-attention",
    response_model=PaginatedNeedsAttentionResponse,
    summary="Mendapatkan daftar laporan yang membutuhkan perhatian segera (AI review / URGENT SLA breach)",
)
def get_needs_attention(
    page: int = Query(1, ge=1, description="Nomor halaman"),
    page_size: int = Query(10, ge=1, le=100, description="Jumlah item per halaman"),
    start_date: datetime | None = Query(None, description="Filter rentang tanggal awal (ISO format)"),
    end_date: datetime | None = Query(None, description="Filter rentang tanggal akhir (ISO format)"),
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> PaginatedNeedsAttentionResponse:
    return DashboardService.get_needs_attention(
        db=db,
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
    )
