"""
Service layer untuk Dashboard & Agregasi Verifier/Admin (Phase 8).
"""

import math
from datetime import date, datetime, time, timedelta

from sqlalchemy import and_, distinct, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.core.exceptions import SigapException
from app.models.ai_analysis import AIAnalysis
from app.models.enums import AIAnalysisStatus, ReportPriority, ReportStatus
from app.models.report import Report
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    DashboardTrendResponse,
    NeedsAttentionReportItem,
    PaginatedNeedsAttentionResponse,
    TrendPoint,
)
from app.schemas.report import map_status_to_tracking


class DashboardService:
    @staticmethod
    def get_summary(
        db: Session,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> DashboardSummaryResponse:
        """
        Ringkasan jumlah laporan per status, prioritas, dan total laporan yang butuh perhatian.
        Menggunakan DB GROUP BY.
        """
        filters = []
        if start_date:
            filters.append(Report.created_at >= start_date)
        if end_date:
            filters.append(Report.created_at <= end_date)

        # 1. Total Reports
        total_reports_query = select(func.count(Report.id))
        if filters:
            total_reports_query = total_reports_query.where(*filters)
        total_reports = db.scalar(total_reports_query) or 0

        # 2. Count by Status
        status_query = select(Report.status, func.count(Report.id))
        if filters:
            status_query = status_query.where(*filters)
        status_query = status_query.group_by(Report.status)
        status_rows = db.execute(status_query).all()

        by_status = {s.value: 0 for s in ReportStatus}
        for st, cnt in status_rows:
            if st:
                key = st.value if hasattr(st, "value") else str(st)
                by_status[key] = cnt

        # 3. Count by Priority
        priority_query = select(Report.priority, func.count(Report.id))
        if filters:
            priority_query = priority_query.where(*filters)
        priority_query = priority_query.group_by(Report.priority)
        priority_rows = db.execute(priority_query).all()

        by_priority = {p.value: 0 for p in ReportPriority}
        for pr, cnt in priority_rows:
            if pr:
                key = pr.value if hasattr(pr, "value") else str(pr)
                by_priority[key] = cnt

        # 4. Needs Attention Count
        sla_threshold = datetime.now() - timedelta(hours=settings.URGENT_SLA_HOURS)

        ai_cond = and_(
            AIAnalysis.needs_human_review == True,
            AIAnalysis.status == AIAnalysisStatus.COMPLETED,
        )
        sla_cond = and_(
            Report.priority == ReportPriority.URGENT,
            Report.status == ReportStatus.PENDING_VERIFICATION,
            Report.created_at <= sla_threshold,
        )

        attention_count_query = (
            select(func.count(distinct(Report.id)))
            .select_from(Report)
            .outerjoin(AIAnalysis, Report.id == AIAnalysis.report_id)
            .where(or_(ai_cond, sla_cond))
        )
        if filters:
            attention_count_query = attention_count_query.where(*filters)

        needs_attention_count = db.scalar(attention_count_query) or 0

        return DashboardSummaryResponse(
            total_reports=total_reports,
            by_status=by_status,
            by_priority=by_priority,
            needs_attention_count=needs_attention_count,
        )

    @staticmethod
    def get_trend(
        db: Session,
        granularity: str = "daily",
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> DashboardTrendResponse:
        """
        Tren jumlah laporan masuk per hari / minggu.
        """
        if granularity not in ["daily", "weekly"]:
            raise SigapException(message="granularity harus 'daily' atau 'weekly'.", status_code=400)

        today = date.today()
        if not end_date:
            end_date = today
        if not start_date:
            start_date = end_date - timedelta(days=30)

        if start_date > end_date:
            raise SigapException(message="start_date tidak boleh lebih besar dari end_date.", status_code=400)

        day_diff = (end_date - start_date).days
        if day_diff > 180:
            raise SigapException(
                message="Rentang tanggal tidak boleh melebihi 180 hari.",
                status_code=400,
            )

        start_dt = datetime.combine(start_date, time.min)
        end_dt = datetime.combine(end_date, time.max)

        # Database expression for grouping
        dialect_name = db.bind.dialect.name if db.bind else "sqlite"
        if granularity == "weekly":
            if dialect_name == "sqlite":
                period_expr = func.strftime("%Y-W%W", Report.created_at)
            else:
                period_expr = func.date_format(Report.created_at, "%Y-W%u")
        else:
            period_expr = func.date(Report.created_at)

        query = (
            select(period_expr.label("period"), func.count(Report.id).label("count"))
            .where(Report.created_at >= start_dt, Report.created_at <= end_dt)
            .group_by(period_expr)
            .order_by(period_expr.asc())
        )

        rows = db.execute(query).all()
        trend_data = [
            TrendPoint(period=str(r.period) if r.period else "", count=r.count)
            for r in rows
        ]

        return DashboardTrendResponse(
            granularity=granularity,
            data=trend_data,
        )

    @staticmethod
    def get_needs_attention(
        db: Session,
        page: int = 1,
        page_size: int = 10,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> PaginatedNeedsAttentionResponse:
        """
        Daftar laporan yang butuh perhatian (AI flagged / URGENT SLA breach).
        """
        sla_threshold = datetime.now() - timedelta(hours=settings.URGENT_SLA_HOURS)

        ai_cond = and_(
            AIAnalysis.needs_human_review == True,
            AIAnalysis.status == AIAnalysisStatus.COMPLETED,
        )
        sla_cond = and_(
            Report.priority == ReportPriority.URGENT,
            Report.status == ReportStatus.PENDING_VERIFICATION,
            Report.created_at <= sla_threshold,
        )

        where_cond = or_(ai_cond, sla_cond)
        filters = [where_cond]
        if start_date:
            filters.append(Report.created_at >= start_date)
        if end_date:
            filters.append(Report.created_at <= end_date)

        # 1. Total Count
        count_query = (
            select(func.count(distinct(Report.id)))
            .select_from(Report)
            .outerjoin(AIAnalysis, Report.id == AIAnalysis.report_id)
            .where(*filters)
        )
        total = db.scalar(count_query) or 0

        total_pages = math.ceil(total / page_size) if total > 0 else 0
        offset = (page - 1) * page_size

        # 2. Main Query
        main_query = (
            select(Report, AIAnalysis)
            .outerjoin(AIAnalysis, Report.id == AIAnalysis.report_id)
            .options(joinedload(Report.category))
            .where(*filters)
            .order_by(Report.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        rows = db.execute(main_query).unique().all()

        items = []
        for r, ai in rows:
            is_ai = bool(ai and ai.status == AIAnalysisStatus.COMPLETED and ai.needs_human_review)
            is_sla = bool(
                r.priority == ReportPriority.URGENT
                and r.status == ReportStatus.PENDING_VERIFICATION
                and r.created_at <= sla_threshold
            )

            if is_ai and is_sla:
                reason = "both"
            elif is_ai:
                reason = "ai_flagged"
            else:
                reason = "urgent_sla_breach"

            item = NeedsAttentionReportItem(
                id=r.id,
                nomor_laporan=r.nomor_laporan,
                category_id=r.category_id,
                category_name=r.category.nama_kategori if r.category else "",
                status_raw=r.status,
                status_tracking=map_status_to_tracking(r.status),
                priority=r.priority,
                latitude=r.latitude,
                longitude=r.longitude,
                waktu_kejadian=r.waktu_kejadian,
                alamat_lokasi=r.alamat_lokasi,
                created_at=r.created_at,
                attention_reason=reason,
            )
            items.append(item)

        return PaginatedNeedsAttentionResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
