"""
Exception handling standar SIGAP Backend.

Phase 1: hanya kerangka dasar agar error tidak membocorkan stack trace
internal ke client (sesuai bagian 30 Master Prompt — Security).
Exception domain-spesifik (mis. ReportNotFound, InvalidStatusTransition)
akan ditambahkan mulai Phase 4+ sesuai kebutuhan tiap service.
"""


class SigapException(Exception):
    """Base exception untuk seluruh error domain SIGAP."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(SigapException):
    def __init__(self, message: str = "Data tidak ditemukan") -> None:
        super().__init__(message, status_code=404)


class UnauthorizedException(SigapException):
    def __init__(self, message: str = "Tidak memiliki akses", status_code: int = 401) -> None:
        super().__init__(message, status_code=status_code)


class ValidationException(SigapException):
    def __init__(self, message: str = "Data tidak valid") -> None:
        super().__init__(message, status_code=422)


class ConfigurationError(SigapException):
    def __init__(self, message: str = "Konfigurasi tidak valid", status_code: int = 500) -> None:
        super().__init__(message, status_code=status_code)

