"""
Repository layer untuk entitas Report dan relasinya.
"""

import math
from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.action_report import ActionReport
from app.models.enums import ReportStatus
from app.models.report import Report
from app.models.report_assignment import ReportAssignment
from app.models.report_evidence import ReportEvidence
from app.models.report_field_value import ReportFieldValue
from app.models.report_sequence import ReportSequence
from app.models.report_status_history import ReportStatusHistory


class ReportRepository:
    """Metode akses data untuk pengaduan laporan (Report)."""

    @staticmethod
    def generate_next_report_number(db: Session, year: int) -> str:
        """
        Generasi nomor laporan konseptual SIGAP-{tahun}-{sequence 5 digit}.
        Menggunakan database row locking (SELECT ... FOR UPDATE) untuk mencegah race condition.
        """
        stmt = select(ReportSequence).where(ReportSequence.year == year).with_for_update()
        seq = db.scalar(stmt)

        if not seq:
            seq = ReportSequence(year=year, current_value=1)
            db.add(seq)
            db.flush()
        else:
            seq.current_value += 1
            db.flush()

        return f"SIGAP-{year}-{seq.current_value:05d}"

    @staticmethod
    def get_by_id(db: Session, report_id: int) -> Report | None:
        """Mengambil detail 1 laporan beserta relasi utamanya."""
        stmt = (
            select(Report)
            .where(Report.id == report_id)
            .options(
                joinedload(Report.citizen),
                joinedload(Report.category),
                selectinload(Report.field_values).joinedload(ReportFieldValue.category_field),
                selectinload(Report.evidences),
                selectinload(Report.status_histories).joinedload(ReportStatusHistory.user),
                selectinload(Report.action_reports).joinedload(ActionReport.officer),
            )
        )
        return db.scalar(stmt)

    @staticmethod
    def get_by_id_for_update(db: Session, report_id: int) -> Report | None:
        """Mengambil detail 1 laporan dengan lock (SELECT ... FOR UPDATE) untuk penanganan konkurensi."""
        stmt = (
            select(Report)
            .where(Report.id == report_id)
            .with_for_update()
            .options(
                joinedload(Report.citizen),
                joinedload(Report.category),
                selectinload(Report.field_values).joinedload(ReportFieldValue.category_field),
                selectinload(Report.evidences),
                selectinload(Report.status_histories).joinedload(ReportStatusHistory.user),
                selectinload(Report.action_reports).joinedload(ActionReport.officer),
            )
        )
        return db.scalar(stmt)


    @staticmethod
    def get_current_assignment(db: Session, report_id: int) -> ReportAssignment | None:
        """Mengambil assignment yang sedang aktif (is_current=True) untuk 1 laporan."""
        stmt = (
            select(ReportAssignment)
            .where(
                ReportAssignment.report_id == report_id,
                ReportAssignment.is_current.is_(True),
            )
            .options(joinedload(ReportAssignment.officer))
        )
        return db.scalar(stmt)

    @staticmethod
    def get_user_reports_paginated(
        db: Session,
        citizen_id: int,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Report], int]:
        """Mengambil daftar laporan milik user tertentu secara terpaginasi."""
        count_stmt = select(func.count(Report.id)).where(Report.citizen_id == citizen_id)
        total = db.scalar(count_stmt) or 0

        offset = (page - 1) * page_size
        items_stmt = (
            select(Report)
            .where(Report.citizen_id == citizen_id)
            .options(joinedload(Report.category))
            .order_by(Report.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list(db.scalars(items_stmt).unique().all())
        return items, total

    @staticmethod
    def get_reports_filtered(
        db: Session,
        status: ReportStatus | None = None,
        category_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Report], int]:
        """Query filter antrean laporan (untuk VERIFIER/ADMIN)."""
        base_stmt = select(Report)

        if status:
            base_stmt = base_stmt.where(Report.status == status)
        if category_id:
            base_stmt = base_stmt.where(Report.category_id == category_id)
        if start_date:
            base_stmt = base_stmt.where(Report.created_at >= start_date)
        if end_date:
            base_stmt = base_stmt.where(Report.created_at <= end_date)

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = db.scalar(count_stmt) or 0

        offset = (page - 1) * page_size
        items_stmt = (
            base_stmt.options(joinedload(Report.category), joinedload(Report.citizen))
            .order_by(Report.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list(db.scalars(items_stmt).unique().all())
        return items, total

    @staticmethod
    def get_assigned_reports_for_officer(
        db: Session,
        officer_id: int,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Report], int]:
        """Mengambil daftar laporan yang di-assign secara aktif ke petugas tertentu."""
        base_stmt = (
            select(Report)
            .join(ReportAssignment, Report.id == ReportAssignment.report_id)
            .where(
                ReportAssignment.officer_id == officer_id,
                ReportAssignment.is_current.is_(True),
            )
        )

        count_stmt = select(func.count()).select_from(base_stmt.subquery())
        total = db.scalar(count_stmt) or 0

        offset = (page - 1) * page_size
        items_stmt = (
            base_stmt.options(joinedload(Report.category), joinedload(Report.citizen))
            .order_by(Report.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        items = list(db.scalars(items_stmt).unique().all())
        return items, total

    @staticmethod
    def get_reports_nearby(
        db: Session,
        lat: float,
        lng: float,
        radius_km: float = 5.0,
    ) -> list[Report]:
        """Query laporan dalam radius lokasi."""
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * math.cos(math.radians(lat)) or 1.0)

        min_lat, max_lat = lat - lat_delta, lat + lat_delta
        min_lng, max_lng = lng - lng_delta, lng + lng_delta

        stmt = (
            select(Report)
            .where(
                Report.latitude.between(min_lat, max_lat),
                Report.longitude.between(min_lng, max_lng),
            )
            .options(joinedload(Report.category))
            .order_by(Report.created_at.desc())
            .limit(50)
        )
        raw_reports = list(db.scalars(stmt).unique().all())

        results = []
        for r in raw_reports:
            dlat = math.radians(r.latitude - lat)
            dlng = math.radians(r.longitude - lng)
            a = (
                math.sin(dlat / 2) ** 2
                + math.cos(math.radians(lat))
                * math.cos(math.radians(r.latitude))
                * math.sin(dlng / 2) ** 2
            )
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            distance = 6371.0 * c
            if distance <= radius_km:
                results.append(r)

        return results
