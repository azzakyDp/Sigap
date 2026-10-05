"""
Enum Python untuk model SQLAlchemy SIGAP Backend.
"""

from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    VERIFIER = "VERIFIER"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"


class ReportStatus(str, Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    DUPLICATE = "DUPLICATE"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    UNRESOLVED = "UNRESOLVED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class ReportPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class AIAnalysisStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
