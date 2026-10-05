"""
Schema Pydantic untuk Workflow Pengaduan (Verifikasi, Priority, Assignment, Action, Resolve, Close).
"""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import ReportPriority, ReportStatus
from app.schemas.report import map_status_to_tracking


class VerifyReportRequest(BaseModel):
    """Payload verifikasi pengaduan (VERIFIER/ADMIN)."""

    decision: ReportStatus = Field(..., description="Keputusan verifikasi: VERIFIED / REJECTED / DUPLICATE")
    catatan: str | None = Field(None, description="Catatan verifikator (opsional)")
    duplicate_of_report_id: int | None = Field(None, description="ID Laporan referensi jika status DUPLICATE")

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: ReportStatus) -> ReportStatus:
        allowed = {ReportStatus.VERIFIED, ReportStatus.REJECTED, ReportStatus.DUPLICATE}
        if v not in allowed:
            raise ValueError("Keputusan verifikasi harus berupa VERIFIED, REJECTED, atau DUPLICATE.")
        return v

    @model_validator(mode="after")
    def validate_duplicate_reference(self) -> "VerifyReportRequest":
        if self.decision == ReportStatus.DUPLICATE and not self.duplicate_of_report_id:
            raise ValueError("duplicate_of_report_id wajib diisi jika keputusan verifikasi adalah DUPLICATE.")
        return self


class UpdatePriorityRequest(BaseModel):
    """Payload penyesuaian prioritas laporan (VERIFIER/ADMIN)."""

    priority: ReportPriority = Field(..., description="Prioritas baru: LOW / MEDIUM / HIGH / URGENT")
    catatan: str | None = Field(None, description="Catatan penyesuaian prioritas (opsional)")


class AssignReportRequest(BaseModel):
    """Payload penugasan laporan ke petugas lapangan (VERIFIER/ADMIN)."""

    officer_id: int = Field(..., description="ID User petugas lapangan (role: OFFICER)")
    catatan: str | None = Field(None, description="Catatan penugasan (opsional)")


class ActionReportRequest(BaseModel):
    """Payload pencatatan laporan tindakan petugas di lapangan (OFFICER)."""

    jenis_tindakan: str = Field(..., min_length=2, max_length=255, description="Jenis tindakan petugas")
    deskripsi: str = Field(..., min_length=5, description="Deskripsi rinci tindakan yang diambil")
    waktu_kedatangan: datetime = Field(..., description="Waktu petugas tiba di lokasi")
    waktu_selesai: datetime | None = Field(None, description="Waktu tindakan penanganan selesai (opsional/nullable jika masih berjalan)")
    hasil: str = Field(..., min_length=3, description="Hasil akhir tindakan penanganan")
    dokumentasi: Any | None = Field(None, description="Dokumentasi foto/catatan tambahan")


class ResolveReportRequest(BaseModel):
    """Payload penyelesaian laporan oleh petugas (OFFICER)."""

    decision: ReportStatus = Field(..., description="Keputusan hasil penanganan: RESOLVED / UNRESOLVED")
    catatan: str = Field(..., min_length=5, description="Catatan ringkasan penyelesaian")

    @field_validator("decision")
    @classmethod
    def validate_decision(cls, v: ReportStatus) -> ReportStatus:
        allowed = {ReportStatus.RESOLVED, ReportStatus.UNRESOLVED}
        if v not in allowed:
            raise ValueError("Keputusan hasil penanganan harus berupa RESOLVED atau UNRESOLVED.")
        return v


class CloseReportRequest(BaseModel):
    """Payload penutupan kasus laporan (VERIFIER/ADMIN)."""

    catatan: str | None = Field(None, description="Catatan penutupan kasus laporan")


class StatusHistoryItemResponse(BaseModel):
    id: int
    status_from_raw: ReportStatus | None
    status_to_raw: ReportStatus
    status_to_tracking: str
    changed_by_nama: str
    changed_at: datetime
    catatan: str | None

    model_config = ConfigDict(from_attributes=True)


class ActionReportResponse(BaseModel):
    id: int
    jenis_tindakan: str
    deskripsi: str
    waktu_kedatangan: datetime
    waktu_selesai: datetime | None = None
    hasil: str
    officer_nama: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

