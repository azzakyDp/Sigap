"""
StorageService — layanan terpusat pengelola penyimpanan file/object SIGAP Backend.
"""

from datetime import datetime
from pathlib import Path
import uuid
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationException

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class StorageService:
    """
    Satu titik akses pengelolaan file (foto bukti pengaduan, KTP, dst).
    Menggunakan konfigurasi STORAGE_LOCAL_PATH.
    """

    def __init__(self, base_path: str | None = None) -> None:
        self.base_path = Path(base_path or settings.STORAGE_LOCAL_PATH)

    def save_evidence_file(self, file: UploadFile) -> tuple[str, str]:
        """
        Validasi dan simpan foto bukti ke storage lokal.
        Mengembalikan tuple: (relative_storage_path, public_url).
        """
        filename = file.filename or ""
        ext = Path(filename).suffix.lower()

        # 1. Validasi Ekstensi & Content-Type
        if ext not in ALLOWED_EXTENSIONS or (
            file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES
        ):
            raise ValidationException(
                "Format file tidak didukung. Hapus foto lain dan unggah file gambar (.jpg, .jpeg, .png)"
            )

        # 2. Validasi Ukuran File (5MB)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)

        if file_size > MAX_FILE_SIZE_BYTES:
            raise ValidationException(
                f"Ukuran file '{filename}' melebihi batas maksimum 5MB."
            )

        if file_size == 0:
            raise ValidationException(f"File '{filename}' kosong.")

        # 3. Validasi Magic Bytes Signature (JPEG/PNG)
        file.file.seek(0)
        header = file.file.read(8)
        file.file.seek(0)

        is_jpeg = header.startswith(b"\xff\xd8\xff")
        is_png = header.startswith(b"\x89PNG\r\n\x1a\n")

        if not (is_jpeg or is_png):
            raise ValidationException(
                f"Isi file '{filename}' bukan gambar JPEG/PNG yang valid."
            )

        # 4. Buat direktori berdasarkan tahun/bulan
        now = datetime.now()
        relative_dir = Path("evidences") / f"{now.year:04d}" / f"{now.month:02d}"
        target_dir = self.base_path / relative_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        # 4. Generate unique filename & simpan file
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        target_file_path = target_dir / unique_filename

        with open(target_file_path, "wb") as buffer:
            buffer.write(file.file.read())

        relative_path_str = (relative_dir / unique_filename).as_posix()
        public_url = f"/api/v1/uploads/{relative_path_str}"

        return relative_path_str, public_url

    def resolve_local_path(self, relative_path: str) -> Path:
        """Mengembalikan Path absolut file untuk disajikan via endpoint controlled serve."""
        safe_path = Path(relative_path).relative_to(Path(relative_path).anchor)
        return (self.base_path / safe_path).resolve()
