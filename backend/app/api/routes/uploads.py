"""
Router Controlled Serve File Uploads (GET /api/v1/uploads/{filepath:path}).
"""

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.core.exceptions import NotFoundException
from app.services.storage_service import StorageService

router = APIRouter(prefix="/uploads", tags=["Uploads"])
storage_service = StorageService()


@router.get(
    "/{filepath:path}",
    summary="Menyajikan file bukti pengaduan terunggah",
)
def serve_upload_file(filepath: str) -> FileResponse:
    """Menyajikan file terunggah secara aman tanpa membocorkan filesystem absolut server."""
    local_path = storage_service.resolve_local_path(filepath)
    if not local_path.is_file():
        raise NotFoundException("File tidak ditemukan")

    return FileResponse(path=local_path)
