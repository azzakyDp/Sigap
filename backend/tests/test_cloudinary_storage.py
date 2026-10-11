"""
Unit tests untuk Cloudinary Storage & AI Image Multimodal Integration.
Mencakup:
1. Upload sukses
2. Validasi tipe file salah, >5 foto, dan ukuran melebihi 5MB
3. Rollback saat upload sebagian gagal
4. Penolakan host non-Cloudinary (Anti-SSRF)
5. AI dengan seluruh foto berhasil
6. AI dengan sebagian foto gagal (photos_analyzed < photos_total)
7. Laporan lama dengan path disk tidak menyebabkan error
"""

from datetime import datetime
import io
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import ValidationException
from app.core.security import hash_password
from app.models.enums import ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.models.report_evidence import ReportEvidence
from app.models.user import User
from app.schemas.report import ReportCreateRequest
from app.services.ai.provider import GeminiProvider, is_safe_cloudinary_url
from app.services.ai.schemas import AnalysisType
from app.services.report_service import ReportService
from app.services.storage.cloudinary_service import CloudinaryService

# Magic bytes sampel
VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 50
VALID_PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
VALID_WEBP_BYTES = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 50
INVALID_EXE_BYTES = b"MZ\x90\x00\x03\x00\x00\x00"


@pytest.fixture
def mock_cloudinary_env(monkeypatch):
    monkeypatch.setattr(settings, "CLOUDINARY_CLOUD_NAME", "sigapcloud")
    monkeypatch.setattr(settings, "CLOUDINARY_API_KEY", "123456789")
    monkeypatch.setattr(settings, "CLOUDINARY_API_SECRET", "supersecret")
    monkeypatch.setattr(settings, "CLOUDINARY_FOLDER", "sigap/reports")


@pytest.fixture
def ai_test_setup(db_session):
    """Fixture untuk menyiapkan data user, kategori, dan report awal untuk testing."""
    citizen = User(
        nama="Citizen User",
        nik="3524011205900001",
        email="citizen_cloud@example.com",
        nomor_hp="081299991111",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    cat = ReportCategory(
        nama_kategori="Jalan Berlubang",
        default_priority=ReportPriority.HIGH,
        is_active=True,
    )
    db_session.add_all([citizen, cat])
    db_session.flush()

    report = Report(
        nomor_laporan="SIGAP-20261011-0001",
        citizen_id=citizen.id,
        category_id=cat.id,
        deskripsi="Laporan pengaduan jalan rusak dekat pasar.",
        waktu_kejadian=datetime.now(),
        latitude=-7.1189,
        longitude=112.4167,
        alamat_lokasi="Jl. Pemuda No. 10",
        status=ReportStatus.PENDING_VERIFICATION,
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)

    return {
        "citizen": citizen,
        "category": cat,
        "report": report,
    }



def create_upload_file(filename: str, content: bytes, content_type: str = "image/jpeg") -> UploadFile:
    return UploadFile(
        filename=filename,
        file=io.BytesIO(content),
        headers={"content-type": content_type},
    )


# --- 1. Upload Sukses ---
def test_cloudinary_upload_success(mock_cloudinary_env):
    service = CloudinaryService()
    assert service.is_configured is True

    fake_response = {
        "secure_url": "https://res.cloudinary.com/sigapcloud/image/upload/v1234/test.jpg",
        "public_id": "sigap/reports/test",
        "width": 800,
        "height": 600,
        "bytes": len(VALID_JPEG_BYTES),
    }

    with patch("cloudinary.uploader.upload", return_value=fake_response) as mock_upload:
        res = service.upload_report_photo_sync(VALID_JPEG_BYTES, "foto.jpg", report_id=101)
        assert res["secure_url"] == fake_response["secure_url"]
        assert res["public_id"] == "sigap/reports/test"
        mock_upload.assert_called_once()


# --- 2. Validasi Tipe File, >5 Foto, dan Ukuran Berlebih ---
def test_validation_invalid_file_type(db_session, ai_test_setup):
    service = ReportService()
    setup = ai_test_setup
    payload = ReportCreateRequest(
        category_id=setup["category"].id,
        deskripsi="Laporan dengan file bukan gambar yang diizinkan.",
        waktu_kejadian=datetime.now(),
        latitude=-7.12,
        longitude=112.41,
        alamat_lokasi="Jl. Merdeka No. 1",
    )
    bad_file = create_upload_file("script.exe", INVALID_EXE_BYTES)

    with pytest.raises(ValidationException) as exc:
        service.create_report(db_session, setup["citizen"], payload, [bad_file])
    assert "tidak didukung" in str(exc.value)


def test_validation_too_many_photos(db_session, ai_test_setup):
    service = ReportService()
    setup = ai_test_setup
    payload = ReportCreateRequest(
        category_id=setup["category"].id,
        deskripsi="Laporan dengan 6 foto melebihi batas.",
        waktu_kejadian=datetime.now(),
        latitude=-7.12,
        longitude=112.41,
        alamat_lokasi="Jl. Merdeka No. 1",
    )
    six_files = [create_upload_file(f"foto_{i}.jpg", VALID_JPEG_BYTES) for i in range(6)]

    with pytest.raises(ValidationException) as exc:
        service.create_report(db_session, setup["citizen"], payload, six_files)
    assert "Maksimal 5 foto" in str(exc.value)


def test_validation_oversized_file(db_session, ai_test_setup):
    service = ReportService()
    setup = ai_test_setup
    payload = ReportCreateRequest(
        category_id=setup["category"].id,
        deskripsi="Laporan dengan foto melebihi 5MB.",
        waktu_kejadian=datetime.now(),
        latitude=-7.12,
        longitude=112.41,
        alamat_lokasi="Jl. Merdeka No. 1",
    )
    huge_bytes = VALID_JPEG_BYTES + b"\x00" * (5 * 1024 * 1024 + 10)
    huge_file = create_upload_file("huge.jpg", huge_bytes)

    with pytest.raises(ValidationException) as exc:
        service.create_report(db_session, setup["citizen"], payload, [huge_file])
    assert "5MB" in str(exc.value)


# --- 3. Rollback Saat Upload Sebagian Gagal ---
def test_rollback_on_partial_upload_failure(mock_cloudinary_env, db_session, ai_test_setup):
    service = ReportService()
    setup = ai_test_setup
    payload = ReportCreateRequest(
        category_id=setup["category"].id,
        deskripsi="Laporan upload multi-foto dengan kegagalan foto kedua.",
        waktu_kejadian=datetime.now(),
        latitude=-7.12,
        longitude=112.41,
        alamat_lokasi="Jl. Merdeka No. 1",
    )
    files = [
        create_upload_file("foto1.jpg", VALID_JPEG_BYTES),
        create_upload_file("foto2.jpg", VALID_PNG_BYTES),
    ]

    # Foto 1 sukses, Foto 2 melempar exception di Cloudinary
    call_count = 0

    def mock_upload(file_bytes, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return {
                "secure_url": "https://res.cloudinary.com/sigapcloud/image/upload/v1/f1.jpg",
                "public_id": "sigap/reports/photo_1",
                "width": 800,
                "height": 600,
                "bytes": len(VALID_JPEG_BYTES),
            }
        raise RuntimeError("Cloudinary network glitch")

    with patch("cloudinary.uploader.upload", side_effect=mock_upload):
        with patch("cloudinary.uploader.destroy", return_value={"result": "ok"}) as mock_destroy:
            with pytest.raises(RuntimeError):
                service.create_report(db_session, setup["citizen"], payload, files)

            # Pastikan destroy dipanggil untuk foto 1 (orphan cleanup)
            mock_destroy.assert_called_once_with("sigap/reports/photo_1", resource_type="image")


# --- 4. Penolakan Host Non-Cloudinary (Anti-SSRF) ---
def test_anti_ssrf_host_rejection(mock_cloudinary_env):
    cloud_name = "sigapcloud"

    # URL valid Cloudinary
    valid_url = "https://res.cloudinary.com/sigapcloud/image/upload/v1234/report1.jpg"
    assert is_safe_cloudinary_url(valid_url, cloud_name) is True

    # Host lain (bukan res.cloudinary.com)
    assert is_safe_cloudinary_url("https://malicious-site.com/image.jpg", cloud_name) is False
    assert is_safe_cloudinary_url("http://169.254.169.254/latest/meta-data/", cloud_name) is False
    assert is_safe_cloudinary_url("https://evil-cloudinary.com/sigapcloud/img.jpg", cloud_name) is False

    # Cloudinary tapi milik akun cloud lain
    assert is_safe_cloudinary_url("https://res.cloudinary.com/othercloud/image/upload/v1234/test.jpg", cloud_name) is False


# --- 5 & 6. AI Image Processing: Seluruh Foto Sukses vs Sebagian Foto Gagal ---
@pytest.mark.anyio
async def test_ai_photo_analysis_all_succeeded(mock_cloudinary_env, db_session, ai_test_setup):
    setup = ai_test_setup
    report = setup["report"]

    # Tambahkan 2 foto bukti Cloudinary
    ev1 = ReportEvidence(
        report_id=report.id,
        file_path="sigap/reports/p1",
        url="https://res.cloudinary.com/sigapcloud/image/upload/v1/p1.jpg",
        public_id="sigap/reports/p1",
        urutan=0,
    )
    ev2 = ReportEvidence(
        report_id=report.id,
        file_path="sigap/reports/p2",
        url="https://res.cloudinary.com/sigapcloud/image/upload/v1/p2.jpg",
        public_id="sigap/reports/p2",
        urutan=1,
    )
    db_session.add_all([ev1, ev2])
    db_session.commit()
    db_session.refresh(report)

    mock_resp = httpx.Response(
        status_code=200,
        content=VALID_JPEG_BYTES,
        headers={"content-type": "image/jpeg"},
        request=httpx.Request("GET", "https://res.cloudinary.com/sigapcloud/image/upload/v1/p1.jpg"),
    )

    provider = GeminiProvider()

    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=mock_resp)):
        with patch.object(provider, "_generate_content_with_fallback") as mock_gen:
            fake_ai_resp = MagicMock()
            fake_ai_resp.text = '{"suggested_category": "Jalan Berlubang", "suggested_priority": "HIGH", "confidence": 0.9, "summary": "Kerusakan jalan terkonfirmasi foto.", "evidence": ["Bukti visual jalan berlubang"]}'
            mock_gen.return_value = (fake_ai_resp, "gemini-3.1-flash-lite")

            result = await provider.analyze(report, AnalysisType.CATEGORY_PRIORITY_SUGGESTION)

            assert result.photos_analyzed == 2
            assert result.photos_total == 2
            assert result.model_name == "gemini-3.1-flash-lite"
            assert "Catatan: Sebagian foto" not in result.summary


@pytest.mark.anyio
async def test_ai_photo_analysis_partial_failed(mock_cloudinary_env, db_session, ai_test_setup):
    setup = ai_test_setup
    report = setup["report"]

    # 2 foto bukti: 1 sukses, 1 404
    ev1 = ReportEvidence(
        report_id=report.id,
        file_path="sigap/reports/p1",
        url="https://res.cloudinary.com/sigapcloud/image/upload/v1/p1.jpg",
        public_id="sigap/reports/p1",
        urutan=0,
    )
    ev2 = ReportEvidence(
        report_id=report.id,
        file_path="sigap/reports/p2",
        url="https://res.cloudinary.com/sigapcloud/image/upload/v1/p2.jpg",
        public_id="sigap/reports/p2",
        urutan=1,
    )
    db_session.add_all([ev1, ev2])
    db_session.commit()
    db_session.refresh(report)

    async def mock_get(url, **kwargs):
        if "p1" in str(url):
            return httpx.Response(
                status_code=200,
                content=VALID_JPEG_BYTES,
                headers={"content-type": "image/jpeg"},
                request=httpx.Request("GET", str(url)),
            )
        return httpx.Response(
            status_code=404,
            content=b"Not found",
            request=httpx.Request("GET", str(url)),
        )

    provider = GeminiProvider()

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        with patch.object(provider, "_generate_content_with_fallback") as mock_gen:
            fake_ai_resp = MagicMock()
            fake_ai_resp.text = '{"suggested_category": "Jalan Berlubang", "suggested_priority": "MEDIUM", "confidence": 0.7, "summary": "Analisis selesai.", "evidence": []}'
            mock_gen.return_value = (fake_ai_resp, "gemini-3.1-flash-lite")

            result = await provider.analyze(report, AnalysisType.CATEGORY_PRIORITY_SUGGESTION)

            assert result.photos_analyzed == 1
            assert result.photos_total == 2
            # Eksplisit ada catatan di summary & warnings
            assert "[Catatan: 1 dari 2 foto tidak dapat dianalisis oleh AI]" in result.summary
            assert len(result.warnings) > 0


# --- 7. Laporan Lama dengan Path Disk Tidak Menyebabkan Error ---
@pytest.mark.anyio
async def test_legacy_report_disk_path_does_not_crash(mock_cloudinary_env, db_session, ai_test_setup):
    setup = ai_test_setup
    report = setup["report"]

    # Record lama hanya memiliki file_path disk, tanpa url/public_id
    legacy_ev = ReportEvidence(
        report_id=report.id,
        file_path="evidences/2026/01/legacy_photo_that_does_not_exist.jpg",
        url=None,
        public_id=None,
        urutan=0,
    )
    db_session.add(legacy_ev)
    db_session.commit()
    db_session.refresh(report)

    provider = GeminiProvider()

    with patch.object(provider, "_generate_content_with_fallback") as mock_gen:
        fake_ai_resp = MagicMock()
        fake_ai_resp.text = '{"suggested_category": "Jalan Berlubang", "suggested_priority": "HIGH", "confidence": 0.65, "summary": "Analisis berbasis teks deskripsi.", "evidence": []}'
        mock_gen.return_value = (fake_ai_resp, "gemini-3.1-flash-lite")

        # Harus tetap selesai tanpa exception
        result = await provider.analyze(report, AnalysisType.CATEGORY_PRIORITY_SUGGESTION)

        assert result.photos_analyzed == 0
        assert result.photos_total == 1
        assert "tidak dapat dianalisis" in result.summary
