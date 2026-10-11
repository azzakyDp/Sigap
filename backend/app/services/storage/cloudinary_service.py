"""
Cloudinary Storage Service — Layanan upload, delete, dan URL transformation foto ke Cloudinary.
"""

import asyncio
import logging
from pathlib import Path
import re
from typing import Any

import cloudinary
import cloudinary.uploader
from app.core.config import settings
from app.core.exceptions import ConfigurationError

logger = logging.getLogger("sigap.cloudinary_service")


class CloudinaryService:
    """
    Pengelola penyimpanan file/foto bukti laporan pengaduan menggunakan Cloudinary.
    """

    def __init__(self) -> None:
        self.cloud_name = settings.CLOUDINARY_CLOUD_NAME
        self.api_key = settings.CLOUDINARY_API_KEY
        self.api_secret = settings.CLOUDINARY_API_SECRET
        self.folder = settings.CLOUDINARY_FOLDER or "sigap/reports"

        if self.is_configured:
            cloudinary.config(
                cloud_name=self.cloud_name,
                api_key=self.api_key,
                api_secret=self.api_secret,
                secure=True,
            )

    @property
    def is_configured(self) -> bool:
        """Mengecek apakah kredensial Cloudinary sudah lengkap."""
        return bool(self.cloud_name and self.api_key and self.api_secret)

    def _ensure_configured(self) -> None:
        if not self.is_configured:
            raise ConfigurationError(
                "Konfigurasi Cloudinary belum lengkap. Harap atur CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di environment."
            )

    def _blocking_upload(
        self,
        file_bytes: bytes,
        filename: str,
        report_id: int | None = None,
    ) -> dict[str, Any]:
        """Fungsi sync blocking untuk upload ke Cloudinary."""
        folder_path = f"{self.folder}/report_{report_id}" if report_id else self.folder
        upload_options = {
            "folder": folder_path,
            "resource_type": "image",
            "use_filename": False,
            "unique_filename": True,
            "overwrite": False,
        }

        res = cloudinary.uploader.upload(file_bytes, **upload_options)
        return {
            "secure_url": res.get("secure_url"),
            "public_id": res.get("public_id"),
            "width": res.get("width"),
            "height": res.get("height"),
            "bytes": res.get("bytes", len(file_bytes)),
        }

    def upload_report_photo_sync(
        self,
        file_bytes: bytes,
        filename: str,
        report_id: int | None = None,
    ) -> dict[str, Any]:
        """Upload foto laporan ke Cloudinary secara sinkron."""
        self._ensure_configured()
        clean_filename = Path(filename).name
        try:
            result = self._blocking_upload(file_bytes, clean_filename, report_id)
            logger.info(
                f"Sukses upload sync ke Cloudinary: public_id='{result.get('public_id')}', "
                f"bytes={result.get('bytes')}"
            )
            return result
        except Exception as exc:
            sanitized_err = str(exc).replace(self.api_secret or "", "***")
            logger.exception(f"Gagal upload foto '{clean_filename}' ke Cloudinary: {sanitized_err}")
            raise RuntimeError(f"Gagal upload foto ke Cloudinary: {sanitized_err}") from exc

    async def upload_report_photo(
        self,
        file_bytes: bytes,
        filename: str,
        report_id: int | None = None,
        timeout_seconds: float = 30.0,
    ) -> dict[str, Any]:
        """
        Upload foto laporan ke Cloudinary secara non-blocking lewat threadpool.
        Mengembalikan dict: {secure_url, public_id, width, height, bytes}.
        """
        self._ensure_configured()
        clean_filename = Path(filename).name

        try:
            result = await asyncio.wait_for(
                asyncio.to_thread(self._blocking_upload, file_bytes, clean_filename, report_id),
                timeout=timeout_seconds,
            )
            logger.info(
                f"Sukses upload ke Cloudinary: public_id='{result.get('public_id')}', "
                f"bytes={result.get('bytes')}"
            )
            return result
        except asyncio.TimeoutError as t_err:
            logger.error(f"Timeout ({timeout_seconds}s) saat upload foto '{clean_filename}' ke Cloudinary")
            raise TimeoutError(f"Upload foto ke Cloudinary mengalami timeout ({timeout_seconds}s)") from t_err
        except Exception as exc:
            # Pastikan API secret tidak bocor di log
            sanitized_err = str(exc).replace(self.api_secret or "", "***")
            logger.exception(f"Gagal upload foto '{clean_filename}' ke Cloudinary: {sanitized_err}")
            raise RuntimeError(f"Gagal upload foto ke Cloudinary: {sanitized_err}") from exc

    def _blocking_delete(self, public_id: str) -> bool:
        """Fungsi sync blocking untuk menghapus foto dari Cloudinary."""
        res = cloudinary.uploader.destroy(public_id, resource_type="image")
        status_res = res.get("result")
        return status_res in ("ok", "not found")

    def delete_photo_sync(self, public_id: str) -> bool:
        """Menghapus foto dari Cloudinary secara sinkron."""
        if not self.is_configured or not public_id:
            return False
        try:
            success = self._blocking_delete(public_id)
            logger.info(f"Hapus foto Cloudinary sync public_id='{public_id}': status={success}")
            return success
        except Exception as exc:
            sanitized_err = str(exc).replace(self.api_secret or "", "***")
            logger.warning(f"Gagal menghapus foto Cloudinary public_id='{public_id}': {sanitized_err}")
            return False

    async def delete_photo(self, public_id: str, timeout_seconds: float = 15.0) -> bool:
        """
        Menghapus foto dari Cloudinary berdasarkan public_id secara non-blocking.
        Best-effort: mengembalikan True jika berhasil, False jika gagal.
        """
        if not self.is_configured or not public_id:
            return False

        try:
            success = await asyncio.wait_for(
                asyncio.to_thread(self._blocking_delete, public_id),
                timeout=timeout_seconds,
            )
            logger.info(f"Hapus foto Cloudinary public_id='{public_id}': status={success}")
            return success
        except Exception as exc:
            sanitized_err = str(exc).replace(self.api_secret or "", "***")
            logger.warning(f"Gagal menghapus foto Cloudinary public_id='{public_id}': {sanitized_err}")
            return False

    @staticmethod
    def build_ai_url(secure_url: str, max_width: int = 1024) -> str:
        """
        Menyisipkan transformasi Cloudinary (c_limit, w_1024, q_auto, f_jpg)
        pada secure_url Cloudinary untuk optimasi pengiriman ke AI.
        Jika URL bukan Cloudinary, kembalikan secure_url apa adanya.
        """
        if not secure_url or "res.cloudinary.com" not in secure_url:
            return secure_url

        transformation = f"c_limit,w_{max_width},q_auto,f_jpg"

        # Pola umum Cloudinary URL: .../image/upload/(v12345/...)
        # Kita sisipkan transformasi tepat setelah /upload/
        if "/image/upload/" in secure_url:
            parts = secure_url.split("/image/upload/", 1)
            # Jika sudah ada transformasi, jangan double insert
            if parts[1].startswith("c_limit,") or parts[1].startswith("w_"):
                return secure_url
            return f"{parts[0]}/image/upload/{transformation}/{parts[1]}"

        return secure_url
