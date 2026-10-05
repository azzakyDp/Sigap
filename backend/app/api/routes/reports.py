"""
Router Pengaduan Laporan & Workflow (Verifikasi, Priority, Assignment, Handling, Action, Resolve, Close).

CATATAN ARSITEKTUR:
Route handler HANYA bertugas menerima request, memicu validasi HTTP/Form/Payload,
memanggil ReportService, dan mengembalikan response.
"""

from datetime import datetime
import json
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.core.exceptions import ValidationException
from app.models.enums import ReportStatus, UserRole
from app.models.user import User
from app.schemas.report import (
    PaginatedReportResponse,
    ReportCreateRequest,
    ReportDetailResponse,
    ReportSummaryResponse,
)
from app.schemas.user import UserResponse
from app.schemas.workflow import (
    ActionReportRequest,
    ActionReportResponse,
    AssignReportRequest,
    CloseReportRequest,
    ResolveReportRequest,
    UpdatePriorityRequest,
    VerifyReportRequest,
)
from app.services.report_service import ReportService

router = APIRouter(tags=["Reports & Workflow"])
report_service = ReportService()


# --- CITIZEN & GENERAL ENDPOINTS ---

@router.post(
    "/reports",
    response_model=ReportDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Membuat Pengaduan Laporan Baru (Masyarakat / CITIZEN)",
)
def create_report(
    category_id: int = Form(..., description="ID Kategori Pengaduan"),
    deskripsi: str = Form(..., min_length=10, description="Deskripsi lengkap kejadian"),
    waktu_kejadian: datetime = Form(..., description="Waktu kejadian berlangsung"),
    latitude: float = Form(..., ge=-90.0, le=90.0, description="Koordinat Latitude (-90 s/d 90)"),
    longitude: float = Form(..., ge=-180.0, le=180.0, description="Koordinat Longitude (-180 s/d 180)"),
    alamat_lokasi: str = Form(..., min_length=5, description="Alamat / keterangan lokasi detail"),
    dynamic_fields: str = Form("{}", description="JSON string key-value field dinamis"),
    files: list[UploadFile] = File(..., description="Minimal 1 foto bukti (jpg/jpeg/png)"),
    current_user: User = Depends(require_role(UserRole.CITIZEN)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Endpoint pembuat pengaduan baru oleh masyarakat terautentikasi (CITIZEN)."""
    try:
        parsed_dynamic_fields = json.loads(dynamic_fields) if dynamic_fields else {}
        if not isinstance(parsed_dynamic_fields, dict):
            raise ValueError
    except Exception:
        raise ValidationException("Format dynamic_fields harus berupa JSON dictionary valid.")

    payload = ReportCreateRequest(
        category_id=category_id,
        deskripsi=deskripsi,
        waktu_kejadian=waktu_kejadian,
        latitude=latitude,
        longitude=longitude,
        alamat_lokasi=alamat_lokasi,
        dynamic_fields=parsed_dynamic_fields,
    )

    return report_service.create_report(
        db=db,
        current_user=current_user,
        payload=payload,
        files=files,
    )


@router.get(
    "/reports/me",
    response_model=PaginatedReportResponse,
    summary="Mendapatkan daftar laporan milik user yang sedang login",
)
def get_my_reports(
    page: int = Query(1, ge=1, description="Nomor halaman"),
    page_size: int = Query(10, ge=1, le=50, description="Jumlah item per halaman"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaginatedReportResponse:
    """Mendapatkan daftar pengaduan yang diajukan oleh pengguna terautentikasi (terpaginasi)."""
    return report_service.get_user_reports_paginated(
        db=db, current_user=current_user, page=page, page_size=page_size
    )


@router.get(
    "/reports/nearby",
    response_model=list[ReportSummaryResponse],
    summary="Mencari pengaduan di sekitar koordinat lokasi tertentu",
)
def get_nearby_reports(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude lokasi pusat"),
    lng: float = Query(..., ge=-180.0, le=180.0, description="Longitude lokasi pusat"),
    radius: float = Query(5.0, ge=0.1, le=50.0, description="Radius pencarian dalam kilometer (default 5km)"),
    db: Session = Depends(get_db),
) -> list[ReportSummaryResponse]:
    """Mencari pengaduan laporan di sekitar titik koordinat untuk kebutuhan peta dashboard."""
    return report_service.get_reports_nearby(db=db, lat=lat, lng=lng, radius_km=radius)


# --- VERIFIER / ADMIN WORKFLOW ENDPOINTS ---

@router.get(
    "/officers",
    response_model=list[UserResponse],
    summary="Mendapatkan daftar petugas lapangan (OFFICER)",
)
def get_officers_list(
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> list[UserResponse]:
    """Mendapatkan daftar seluruh pengguna dengan role OFFICER untuk dipilih saat penugasan."""
    return report_service.get_officers_list(db=db)


@router.get(
    "/reports",
    response_model=PaginatedReportResponse,
    summary="Mendapatkan antrean laporan terfilter (VERIFIER/ADMIN)",
)
def get_reports_queue(
    status_filter: ReportStatus | None = Query(None, alias="status", description="Filter status laporan"),
    category_id: int | None = Query(None, description="Filter ID kategori"),
    start_date: datetime | None = Query(None, description="Filter tanggal awal"),
    end_date: datetime | None = Query(None, description="Filter tanggal akhir"),
    page: int = Query(1, ge=1, description="Nomor halaman"),
    page_size: int = Query(10, ge=1, le=50, description="Jumlah item per halaman"),
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> PaginatedReportResponse:
    """Mendapatkan antrean daftar pengaduan laporan terfilter untuk proses verifikasi dan pemantauan."""
    return report_service.get_reports_queue(
        db=db,
        status=status_filter,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@router.patch(
    "/reports/{report_id}/verify",
    response_model=ReportDetailResponse,
    summary="Verifikasi Pengaduan Laporan (VERIFIER/ADMIN)",
)
def verify_report(
    report_id: int,
    payload: VerifyReportRequest,
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Verifikasi laporan (PENDING_VERIFICATION -> VERIFIED / REJECTED / DUPLICATE)."""
    return report_service.verify_report(
        db=db, current_user=current_user, report_id=report_id, payload=payload
    )


@router.patch(
    "/reports/{report_id}/priority",
    response_model=ReportDetailResponse,
    summary="Mengubah Prioritas Laporan (VERIFIER/ADMIN)",
)
def update_priority(
    report_id: int,
    payload: UpdatePriorityRequest,
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Mengubah prioritas final laporan (LOW / MEDIUM / HIGH / URGENT)."""
    return report_service.update_priority(
        db=db, current_user=current_user, report_id=report_id, payload=payload
    )


@router.post(
    "/reports/{report_id}/assign",
    response_model=ReportDetailResponse,
    summary="Penugasan Laporan ke Petugas Lapangan (VERIFIER/ADMIN)",
)
def assign_report(
    report_id: int,
    payload: AssignReportRequest,
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Penugasan atau penugasan ulang (reassignment) laporan ke petugas OFFICER (VERIFIED -> ASSIGNED)."""
    return report_service.assign_report(
        db=db, current_user=current_user, report_id=report_id, payload=payload
    )


@router.patch(
    "/reports/{report_id}/close",
    response_model=ReportDetailResponse,
    summary="Penutupan Kasus Laporan (VERIFIER/ADMIN)",
)
def close_report(
    report_id: int,
    payload: CloseReportRequest,
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Menutup kasus laporan (RESOLVED / UNRESOLVED -> CLOSED)."""
    return report_service.close_report(
        db=db, current_user=current_user, report_id=report_id, payload=payload
    )


# --- OFFICER WORKFLOW ENDPOINTS ---

@router.get(
    "/reports/assigned-to-me",
    response_model=PaginatedReportResponse,
    summary="Mendapatkan daftar laporan yang ditugaskan ke petugas login (OFFICER)",
)
def get_assigned_to_me(
    page: int = Query(1, ge=1, description="Nomor halaman"),
    page_size: int = Query(10, ge=1, le=50, description="Jumlah item per halaman"),
    current_user: User = Depends(require_role(UserRole.OFFICER)),
    db: Session = Depends(get_db),
) -> PaginatedReportResponse:
    """Mendapatkan daftar pengaduan laporan yang sedang di-assign secara aktif ke petugas yang sedang login."""
    return report_service.get_assigned_to_me(
        db=db, current_user=current_user, page=page, page_size=page_size
    )


@router.patch(
    "/reports/{report_id}/start-handling",
    response_model=ReportDetailResponse,
    summary="Mulai Penanganan Lapangan (OFFICER)",
)
def start_handling(
    report_id: int,
    current_user: User = Depends(require_role(UserRole.OFFICER)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Petugas mulai melakukan tindakan penanganan lapangan (ASSIGNED -> IN_PROGRESS)."""
    return report_service.start_handling(db=db, current_user=current_user, report_id=report_id)


@router.post(
    "/reports/{report_id}/action-reports",
    response_model=ActionReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Mencatat Laporan Tindakan Petugas (OFFICER)",
)
def create_action_report(
    report_id: int,
    payload: ActionReportRequest,
    current_user: User = Depends(require_role(UserRole.OFFICER)),
    db: Session = Depends(get_db),
) -> ActionReportResponse:
    """Mencatat laporan hasil tindakan progresif petugas di lokasi kejadian."""
    return report_service.create_action_report(
        db=db, current_user=current_user, report_id=report_id, payload=payload
    )


@router.patch(
    "/reports/{report_id}/resolve",
    response_model=ReportDetailResponse,
    summary="Penyelesaian Penanganan Laporan (OFFICER)",
)
def resolve_report(
    report_id: int,
    payload: ResolveReportRequest,
    current_user: User = Depends(require_role(UserRole.OFFICER)),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Petugas menyelesaikannya penanganan laporan (IN_PROGRESS -> RESOLVED / UNRESOLVED)."""
    return report_service.resolve_report(
        db=db, current_user=current_user, report_id=report_id, payload=payload
    )


# --- DETAIL REPORT (MUST BE PLACED LAST TO PREVENT ROUTE COLLISION WITH /reports/me, /reports/nearby, /reports/assigned-to-me) ---

@router.get(
    "/reports/{report_id}",
    response_model=ReportDetailResponse,
    summary="Mendapatkan detail 1 laporan",
)
def get_report_detail(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReportDetailResponse:
    """Mendapatkan detail pengaduan laporan (Otorisasi ownership untuk CITIZEN)."""
    return report_service.get_report_detail(db=db, current_user=current_user, report_id=report_id)
