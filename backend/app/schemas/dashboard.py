"""
Schema Pydantic untuk Dashboard & Agregasi Verifier/Admin (Phase 8).
"""

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.report import ReportSummaryResponse


class DashboardSummaryResponse(BaseModel):
    total_reports: int = Field(..., description="Total seluruh laporan")
    by_status: dict[str, int] = Field(..., description="Jumlah laporan per status")
    by_priority: dict[str, int] = Field(..., description="Jumlah laporan per prioritas")
    needs_attention_count: int = Field(..., description="Jumlah laporan yang membutuhkan perhatian segera")


class TrendPoint(BaseModel):
    period: str = Field(..., description="Periode waktu (YYYY-MM-DD untuk daily, YYYY-Wweek untuk weekly)")
    count: int = Field(..., description="Jumlah laporan masuk")


class DashboardTrendResponse(BaseModel):
    granularity: str = Field(..., description="Granularitas tren ('daily' | 'weekly')")
    data: list[TrendPoint] = Field(default_factory=list, description="Daftar tren statistik laporan")


class NeedsAttentionReportItem(ReportSummaryResponse):
    attention_reason: str = Field(..., description="Alasan butuh perhatian ('ai_flagged' | 'urgent_sla_breach' | 'both')")

    model_config = ConfigDict(from_attributes=True)


class PaginatedNeedsAttentionResponse(BaseModel):
    items: list[NeedsAttentionReportItem]
    total: int
    page: int
    page_size: int
    total_pages: int
