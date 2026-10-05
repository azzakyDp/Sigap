"""
Package schemas SIGAP Backend.
"""

from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
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

__all__ = [
    "UserResponse",
    "RegisterRequest",
    "LoginRequest",
    "TokenResponse",
    "CategoryFieldResponse",
    "ReportCategoryResponse",
    "ReportCreateRequest",
    "ReportEvidenceResponse",
    "ReportFieldValueResponse",
    "ReportSummaryResponse",
    "ReportDetailResponse",
    "PaginatedReportResponse",
    "map_status_to_tracking",
    "VerifyReportRequest",
    "UpdatePriorityRequest",
    "AssignReportRequest",
    "ActionReportRequest",
    "ResolveReportRequest",
    "CloseReportRequest",
    "StatusHistoryItemResponse",
    "ActionReportResponse",
]