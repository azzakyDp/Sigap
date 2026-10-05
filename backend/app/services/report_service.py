"""
ReportService — Layanan terpusat untuk alur dan logika bisnis Pengaduan (Report CRUD & Workflow).

SESUAI ATURAN ARSITEKTUR:
Seluruh business logic transisi status, verifikasi, penugasan, penanganan, dan penyelesaian
dipusatkan secara atomik di service ini.
"""

from datetime import datetime
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, UnauthorizedException, ValidationException
from app.models.action_report import ActionReport
from app.models.enums import ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_assignment import ReportAssignment
from app.models.report_evidence import ReportEvidence
from app.models.report_field_value import ReportFieldValue
from app.models.report_status_history import ReportStatusHistory
from app.models.user import User
from app.repositories.category_repository import CategoryRepository
from app.repositories.report_repository import ReportRepository
from app.repositories.user_repository import UserRepository
from app.schemas.category import CategoryFieldResponse, ReportCategoryResponse
from app.schemas.report import (
    CurrentAssignmentResponse,
    PaginatedReportResponse,
    ReportCreateRequest,
    ReportDetailResponse,
    ReportEvidenceResponse,
    ReportFieldValueResponse,
    ReportSummaryResponse,
    map_status_to_tracking,
)
from app.schemas.user import UserResponse
from app.schemas.workflow import (
    ActionReportRequest,
    ActionReportResponse,
    AssignReportRequest,
    CloseReportRequest,
    ResolveReportRequest,
    StatusHistoryItemResponse,
    UpdatePriorityRequest,
    VerifyReportRequest,
)
from app.services.storage_service import StorageService


class ReportService:
    """Service layer utama pengaduan SIGAP."""

    def __init__(self, storage_service: StorageService | None = None) -> None:
        self.storage_service = storage_service or StorageService()

    # --- CATEGORY & PUBLIC ---

    def get_categories(self, db: Session) -> list[ReportCategoryResponse]:
        """Mengambil seluruh kategori pengaduan aktif."""
        categories = CategoryRepository.get_active_categories(db)
        return [ReportCategoryResponse.model_validate(c) for c in categories]

    # --- CITIZEN WORKFLOW ---

    def create_report(
        self,
        db: Session,
        current_user: User,
        payload: ReportCreateRequest,
        files: list[UploadFile],
    ) -> ReportDetailResponse:
        """Membuat pengaduan laporan baru secara atomik."""
        category = CategoryRepository.get_category_by_id(db, payload.category_id)
        if not category or not category.is_active:
            raise ValidationException("Kategori pengaduan tidak ditemukan atau tidak aktif.")

        if not files or len(files) == 0:
            raise ValidationException("Minimal 1 foto bukti wajib diunggah.")

        if len(files) > 5:
            raise ValidationException("Maksimal 5 foto bukti per laporan.")

        category_fields_map = {f.field_name: f for f in category.fields}

        for submitted_key in payload.dynamic_fields.keys():
            if submitted_key not in category_fields_map:
                raise ValidationException(
                    f"Field '{submitted_key}' tidak dikenal untuk kategori '{category.nama_kategori}'."
                )

        for field_name, f_spec in category_fields_map.items():
            if f_spec.is_required:
                val = payload.dynamic_fields.get(field_name)
                if not val or not str(val).strip():
                    raise ValidationException(
                        f"Field wajib '{field_name}' pada kategori '{category.nama_kategori}' belum diisi."
                    )

        year = payload.waktu_kejadian.year
        nomor_laporan = ReportRepository.generate_next_report_number(db, year=year)

        saved_evidences = []
        for file in files:
            relative_path, public_url = self.storage_service.save_evidence_file(file)
            saved_evidences.append((relative_path, public_url))

        try:
            new_report = Report(
                nomor_laporan=nomor_laporan,
                citizen_id=current_user.id,
                category_id=category.id,
                deskripsi=payload.deskripsi.strip(),
                waktu_kejadian=payload.waktu_kejadian,
                latitude=payload.latitude,
                longitude=payload.longitude,
                alamat_lokasi=payload.alamat_lokasi.strip(),
                status=ReportStatus.PENDING_VERIFICATION,
                priority=category.default_priority,
            )
            db.add(new_report)
            db.flush()

            for field_name, value in payload.dynamic_fields.items():
                f_spec = category_fields_map[field_name]
                fv = ReportFieldValue(
                    report_id=new_report.id,
                    category_field_id=f_spec.id,
                    value=str(value).strip(),
                )
                db.add(fv)

            for rel_path, pub_url in saved_evidences:
                ev = ReportEvidence(
                    report_id=new_report.id,
                    file_path=rel_path,
                )
                db.add(ev)

            history = ReportStatusHistory(
                report_id=new_report.id,
                status_from=None,
                status_to=ReportStatus.PENDING_VERIFICATION,
                changed_by=current_user.id,
                catatan="Pengaduan baru berhasil dibuat oleh masyarakat",
            )
            db.add(history)

            db.commit()
            db.refresh(new_report)
        except Exception as e:
            db.rollback()
            raise e

        return self._build_detail_response(db, new_report.id, current_user.nama)

    def get_user_reports_paginated(
        self,
        db: Session,
        current_user: User,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedReportResponse:
        """Mendapatkan daftar laporan milik user yang login."""
        items, total = ReportRepository.get_user_reports_paginated(
            db, citizen_id=current_user.id, page=page, page_size=page_size
        )
        return self._build_paginated_response(items, total, page, page_size)

    def get_report_detail(
        self,
        db: Session,
        current_user: User,
        report_id: int,
    ) -> ReportDetailResponse:
        """Detail 1 laporan dengan otorisasi ownership."""
        report = ReportRepository.get_by_id(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if current_user.role == UserRole.CITIZEN and report.citizen_id != current_user.id:
            raise NotFoundException("Laporan tidak ditemukan")

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    def get_reports_nearby(
        self,
        db: Session,
        lat: float,
        lng: float,
        radius_km: float = 5.0,
    ) -> list[ReportSummaryResponse]:
        """Query laporan di sekitar lokasi."""
        reports = ReportRepository.get_reports_nearby(db, lat=lat, lng=lng, radius_km=radius_km)
        return [
            ReportSummaryResponse(
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
            )
            for r in reports
        ]    # --- VERIFIER WORKFLOW ---

    def get_officers_list(self, db: Session) -> list[UserResponse]:
        """Mendapatkan daftar user ber-role OFFICER untuk dipilih saat penugasan."""
        officers = UserRepository.get_users_by_role(db, UserRole.OFFICER)
        return [UserResponse.model_validate(o) for o in officers]

    def get_reports_queue(
        self,
        db: Session,
        status: ReportStatus | None = None,
        category_id: int | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedReportResponse:
        """Mendapatkan antrean laporan terfilter untuk Verifikator/Admin."""
        items, total = ReportRepository.get_reports_filtered(
            db=db,
            status=status,
            category_id=category_id,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )
        return self._build_paginated_response(items, total, page, page_size)

    def verify_report(
        self,
        db: Session,
        current_user: User,
        report_id: int,
        payload: VerifyReportRequest,
    ) -> ReportDetailResponse:
        """Verifikasi pengaduan laporan (VERIFIER/ADMIN)."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if report.status != ReportStatus.PENDING_VERIFICATION:
            raise ValidationException(
                f"Laporan berstatus '{report.status.value}' tidak dapat diverifikasi (hanya PENDING_VERIFICATION)."
            )

        if payload.decision == ReportStatus.DUPLICATE:
            if not payload.duplicate_of_report_id:
                raise ValidationException("ID laporan referensi duplikat wajib diisi jika keputusan adalah DUPLICATE.")
            if payload.duplicate_of_report_id == report.id:
                raise ValidationException("Laporan tidak dapat ditandai sebagai duplikat dari dirinya sendiri.")
            target_dup = ReportRepository.get_by_id(db, payload.duplicate_of_report_id)
            if not target_dup:
                raise ValidationException(f"Laporan referensi duplikat #{payload.duplicate_of_report_id} tidak ditemukan.")

        try:
            prev_status = report.status
            report.status = payload.decision

            history_catatan = payload.catatan or f"Verifikasi laporan: {payload.decision.value}"
            if payload.decision == ReportStatus.DUPLICATE and payload.duplicate_of_report_id:
                history_catatan += f" (Referensikan Laporan ID #{payload.duplicate_of_report_id})"

            history = ReportStatusHistory(
                report_id=report.id,
                status_from=prev_status,
                status_to=payload.decision,
                changed_by=current_user.id,
                catatan=history_catatan,
            )
            db.add(history)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    def update_priority(
        self,
        db: Session,
        current_user: User,
        report_id: int,
        payload: UpdatePriorityRequest,
    ) -> ReportDetailResponse:
        """Penyesuaian prioritas laporan (VERIFIER/ADMIN)."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        try:
            prev_priority = report.priority
            report.priority = payload.priority

            history = ReportStatusHistory(
                report_id=report.id,
                status_from=report.status,
                status_to=report.status,
                changed_by=current_user.id,
                catatan=payload.catatan or f"Penyesuaian prioritas dari {prev_priority.value} menjadi {payload.priority.value}",
            )
            db.add(history)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    def assign_report(
        self,
        db: Session,
        current_user: User,
        report_id: int,
        payload: AssignReportRequest,
    ) -> ReportDetailResponse:
        """Penugasan / penugasan ulang (reassignment) laporan ke petugas lapangan (VERIFIER/ADMIN)."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if report.status not in (ReportStatus.VERIFIED, ReportStatus.ASSIGNED, ReportStatus.UNRESOLVED):
            raise ValidationException(
                f"Laporan berstatus '{report.status.value}' tidak dapat ditugaskan. Laporan harus berstatus VERIFIED, ASSIGNED, atau UNRESOLVED."
            )

        officer = UserRepository.get_by_id(db, payload.officer_id)
        if not officer or officer.role != UserRole.OFFICER:
            raise ValidationException("User target penugasan tidak ditemukan atau bukan merupakan OFFICER.")

        try:
            # 1. Reassignment: Lock dan set is_current = False pada assignment aktif sebelumnya
            active_assignments = db.scalars(
                select(ReportAssignment)
                .where(ReportAssignment.report_id == report.id, ReportAssignment.is_current.is_(True))
                .with_for_update()
            ).all()

            for old_assignment in active_assignments:
                if old_assignment.officer_id == officer.id:
                    raise ValidationException(f"Laporan saat ini sudah ditugaskan kepada petugas '{officer.nama}'.")
                old_assignment.is_current = False

            # 2. Insert assignment baru
            new_assignment = ReportAssignment(
                report_id=report.id,
                officer_id=officer.id,
                assigned_by=current_user.id,
                is_current=True,
            )
            db.add(new_assignment)

            # 3. Update status & history
            prev_status = report.status
            report.status = ReportStatus.ASSIGNED

            history = ReportStatusHistory(
                report_id=report.id,
                status_from=prev_status,
                status_to=ReportStatus.ASSIGNED,
                changed_by=current_user.id,
                catatan=payload.catatan or f"Penugasan ke petugas {officer.nama}",
            )
            db.add(history)

            db.commit()
        except Exception as e:
            db.rollback()
            raise e

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    # --- OFFICER WORKFLOW ---

    def get_assigned_to_me(
        self,
        db: Session,
        current_user: User,
        page: int = 1,
        page_size: int = 10,
    ) -> PaginatedReportResponse:
        """Daftar laporan yang di-assign secara aktif ke petugas yang sedang login (OFFICER)."""
        items, total = ReportRepository.get_assigned_reports_for_officer(
            db, officer_id=current_user.id, page=page, page_size=page_size
        )
        return self._build_paginated_response(items, total, page, page_size)

    def start_handling(
        self,
        db: Session,
        current_user: User,
        report_id: int,
    ) -> ReportDetailResponse:
        """Mulai penanganan lapangan (ASSIGNED -> IN_PROGRESS) oleh OFFICER."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if report.status != ReportStatus.ASSIGNED:
            raise ValidationException(
                f"Laporan berstatus '{report.status.value}' tidak dapat mulai ditangani (harus ASSIGNED)."
            )

        current_assignment = ReportRepository.get_current_assignment(db, report.id)
        if not current_assignment or current_assignment.officer_id != current_user.id:
            raise UnauthorizedException("Anda bukan petugas yang ditugaskan secara aktif untuk laporan ini.")

        try:
            report.status = ReportStatus.IN_PROGRESS
            history = ReportStatusHistory(
                report_id=report.id,
                status_from=ReportStatus.ASSIGNED,
                status_to=ReportStatus.IN_PROGRESS,
                changed_by=current_user.id,
                catatan="Petugas mulai menangani pengaduan di lokasi lapangan",
            )
            db.add(history)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    def create_action_report(
        self,
        db: Session,
        current_user: User,
        report_id: int,
        payload: ActionReportRequest,
    ) -> ActionReportResponse:
        """Mencatat laporan hasil tindakan petugas di lapangan (OFFICER)."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if report.status != ReportStatus.IN_PROGRESS:
            raise ValidationException(
                f"Tindakan hanya dapat dicatat untuk laporan yang sedang berstatus IN_PROGRESS (saat ini: '{report.status.value}')."
            )

        current_assignment = ReportRepository.get_current_assignment(db, report.id)
        if not current_assignment or current_assignment.officer_id != current_user.id:
            raise UnauthorizedException("Anda bukan petugas yang ditugaskan secara aktif untuk laporan ini.")

        try:
            action = ActionReport(
                report_id=report.id,
                officer_id=current_user.id,
                jenis_tindakan=payload.jenis_tindakan.strip(),
                deskripsi=payload.deskripsi.strip(),
                waktu_kedatangan=payload.waktu_kedatangan,
                waktu_selesai=payload.waktu_selesai,
                hasil=payload.hasil.strip(),
                dokumentasi=payload.dokumentasi,
            )
            db.add(action)
            db.commit()
            db.refresh(action)
        except Exception as e:
            db.rollback()
            raise e

        return ActionReportResponse(
            id=action.id,
            jenis_tindakan=action.jenis_tindakan,
            deskripsi=action.deskripsi,
            waktu_kedatangan=action.waktu_kedatangan,
            waktu_selesai=action.waktu_selesai,
            hasil=action.hasil,
            officer_nama=current_user.nama,
            created_at=action.created_at,
        )

    def resolve_report(
        self,
        db: Session,
        current_user: User,
        report_id: int,
        payload: ResolveReportRequest,
    ) -> ReportDetailResponse:
        """Penyelesaian penanganan laporan oleh OFFICER (IN_PROGRESS -> RESOLVED/UNRESOLVED)."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if report.status != ReportStatus.IN_PROGRESS:
            raise ValidationException(
                f"Laporan berstatus '{report.status.value}' tidak dapat diselesaikan (harus IN_PROGRESS)."
            )

        current_assignment = ReportRepository.get_current_assignment(db, report.id)
        if not current_assignment or current_assignment.officer_id != current_user.id:
            raise UnauthorizedException("Anda bukan petugas yang ditugaskan secara aktif untuk me-resolve laporan ini.")

        try:
            report.status = payload.decision
            history = ReportStatusHistory(
                report_id=report.id,
                status_from=ReportStatus.IN_PROGRESS,
                status_to=payload.decision,
                changed_by=current_user.id,
                catatan=payload.catatan,
            )
            db.add(history)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    def close_report(
        self,
        db: Session,
        current_user: User,
        report_id: int,
        payload: CloseReportRequest,
    ) -> ReportDetailResponse:
        """Penutupan kasus laporan oleh VERIFIER/ADMIN (RESOLVED/UNRESOLVED -> CLOSED)."""
        report = ReportRepository.get_by_id_for_update(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        if report.status not in (ReportStatus.RESOLVED, ReportStatus.UNRESOLVED):
            raise ValidationException(
                f"Laporan berstatus '{report.status.value}' tidak dapat ditutup (harus RESOLVED atau UNRESOLVED)."
            )

        try:
            prev_status = report.status
            report.status = ReportStatus.CLOSED

            history = ReportStatusHistory(
                report_id=report.id,
                status_from=prev_status,
                status_to=ReportStatus.CLOSED,
                changed_by=current_user.id,
                catatan=payload.catatan or "Penutupan kasus pengaduan laporan",
            )
            db.add(history)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

        citizen_name = report.citizen.nama if report.citizen else ""
        return self._build_detail_response(db, report.id, citizen_name)

    # --- HELPERS ---

    def _build_paginated_response(self, items: list[Report], total: int, page: int, page_size: int) -> PaginatedReportResponse:
        summaries = [
            ReportSummaryResponse(
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
            )
            for r in items
        ]
        total_pages = (total + page_size - 1) // page_size if page_size > 0 else 1
        return PaginatedReportResponse(
            items=summaries,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def _build_detail_response(self, db: Session, report_id: int, citizen_name: str) -> ReportDetailResponse:
        report = ReportRepository.get_by_id(db, report_id)
        if not report:
            raise NotFoundException("Laporan tidak ditemukan")

        evidences = [
            ReportEvidenceResponse(
                id=ev.id,
                file_path=ev.file_path,
                url=f"/api/v1/uploads/{ev.file_path}",
                uploaded_at=ev.uploaded_at,
            )
            for ev in report.evidences
        ]

        field_values = [
            ReportFieldValueResponse(
                field_name=fv.category_field.field_name if fv.category_field else "field",
                value=fv.value,
            )
            for fv in report.field_values
        ]

        status_histories = [
            StatusHistoryItemResponse(
                id=h.id,
                status_from_raw=h.status_from,
                status_to_raw=h.status_to,
                status_to_tracking=map_status_to_tracking(h.status_to),
                changed_by_nama=h.user.nama if h.user else "System",
                changed_at=h.changed_at,
                catatan=h.catatan,
            )
            for h in report.status_histories
        ]

        action_reports = [
            ActionReportResponse(
                id=act.id,
                jenis_tindakan=act.jenis_tindakan,
                deskripsi=act.deskripsi,
                waktu_kedatangan=act.waktu_kedatangan,
                waktu_selesai=act.waktu_selesai,
                hasil=act.hasil,
                officer_nama=act.officer.nama if act.officer else "Officer",
                created_at=act.created_at,
            )
            for act in report.action_reports
        ]

        current_assignment_obj = ReportRepository.get_current_assignment(db, report.id)
        current_assignment = None
        if current_assignment_obj and current_assignment_obj.officer:
            current_assignment = CurrentAssignmentResponse(
                officer_id=current_assignment_obj.officer_id,
                officer_nama=current_assignment_obj.officer.nama,
                assigned_at=current_assignment_obj.assigned_at,
            )

        return ReportDetailResponse(
            id=report.id,
            nomor_laporan=report.nomor_laporan,
            citizen_id=report.citizen_id,
            citizen_nama=citizen_name,
            category_id=report.category_id,
            category_name=report.category.nama_kategori if report.category else "",
            deskripsi=report.deskripsi,
            waktu_kejadian=report.waktu_kejadian,
            latitude=report.latitude,
            longitude=report.longitude,
            alamat_lokasi=report.alamat_lokasi,
            status_raw=report.status,
            status_tracking=map_status_to_tracking(report.status),
            priority=report.priority,
            field_values=field_values,
            evidences=evidences,
            status_histories=status_histories,
            action_reports=action_reports,
            current_assignment=current_assignment,
            created_at=report.created_at,
            updated_at=report.updated_at,
        )
