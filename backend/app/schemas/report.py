"""
Schema Pydantic untuk Pengaduan Laporan (Report CRUD, Dynamic Fields, Status Mapping).
"""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import ReportPriority, ReportStatus

STATUS_TRACKING_MAPPING: dict[ReportStatus, str] = {
    ReportStatus.PENDING_VERIFICATION: "Menunggu Verifikasi",
    ReportStatus.VERIFIED: "Diverifikasi",
    ReportStatus.ASSIGNED: "Diverifikasi",
    ReportStatus.IN_PROGRESS: "Dalam Penanganan",
    ReportStatus.UNRESOLVED: "Belum Terselesaikan",
    ReportStatus.RESOLVED: "Selesai",
    ReportStatus.CLOSED: "Selesai",
    ReportStatus.REJECTED: "Ditolak",
    ReportStatus.DUPLICATE: "Duplikat",
}


def map_status_to_tracking(status: ReportStatus) -> str:
    """Mengubah enum ReportStatus mentah menjadi teks tracking status bahasa Indonesia."""
    return STATUS_TRACKING_MAPPING.get(status, status.value)


class ReportCreateRequest(BaseModel):
    """Payload JSON untuk membuat pengaduan baru."""

    category_id: int = Field(..., description="ID Kategori Pengaduan")
    deskripsi: str = Field(..., min_length=10, description="Deskripsi lengkap kejadian")
    waktu_kejadian: datetime = Field(..., description="Waktu kejadian berlangsung")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Koordinat Latitude (-90 s/d 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Koordinat Longitude (-180 s/d 180)")
    alamat_lokasi: str = Field(..., min_length=5, description="Alamat / keterangan lokasi detail")
    dynamic_fields: dict[str, str] = Field(
        default_factory=dict,
        description="Key-value field dinamis sesuai kriteria kategori",
    )


class ReportEvidenceResponse(BaseModel):
    id: int
    file_path: str
    url: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportFieldValueResponse(BaseModel):
    field_name: str
    value: str

    model_config = ConfigDict(from_attributes=True)


class ReportSummaryResponse(BaseModel):
    """Summary item laporan untuk daftar laporan (GET /reports/me)."""

    id: int
    nomor_laporan: str
    category_id: int
    category_name: str
    status_raw: ReportStatus
    status_tracking: str
    priority: ReportPriority
    latitude: float
    longitude: float
    waktu_kejadian: datetime
    alamat_lokasi: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CurrentAssignmentResponse(BaseModel):
    officer_id: int
    officer_nama: str
    assigned_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportDetailResponse(BaseModel):
    """Detail lengkap laporan (GET /reports/{id})."""

    id: int
    nomor_laporan: str
    citizen_id: int
    citizen_nama: str
    category_id: int
    category_name: str
    deskripsi: str
    waktu_kejadian: datetime
    latitude: float
    longitude: float
    alamat_lokasi: str
    status_raw: ReportStatus
    status_tracking: str
    priority: ReportPriority
    field_values: list[ReportFieldValueResponse] = []
    evidences: list[ReportEvidenceResponse] = []
    status_histories: list[Any] = []
    action_reports: list[Any] = []
    current_assignment: CurrentAssignmentResponse | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedReportResponse(BaseModel):
    items: list[ReportSummaryResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
