"""
Unit & Integration Tests untuk AI Analysis Phase 6 & Phase 7 (Prompts, Schemas, Provider Mocking & Background Job).
"""

from datetime import datetime
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.exceptions import ConfigurationError, NotFoundException
from app.core.security import create_access_token, hash_password
from app.models.ai_analysis import AIAnalysis
from app.models.enums import AIAnalysisStatus, ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.models.user import User
from app.services.ai.ai_service import AIAnalysisService, run_analysis_job
from app.services.ai.prompts import build_category_priority_prompt
from app.services.ai.provider import GeminiProvider, get_ai_provider
from app.services.ai.schemas import AIAnalysisResponse, AIAnalysisResult, AnalysisType


@pytest.fixture(autouse=True)
def mock_gemini_provider_analyze(monkeypatch):
    """
    Autouse fixture untuk memastikan pytest otomatis ter-mock dan TIDAK memanggil Gemini API sungguhan.
    """
    async def mock_analyze(self, report, analysis_type):
        return AIAnalysisResult(
            model_name="gemini-3.1-flash-lite",
            analysis_type=analysis_type,
            suggested_category="Jalan Berlubang",
            suggested_priority="HIGH",
            confidence=0.85,
            summary="Analisis AI belum diimplementasikan (Phase 7).",
            evidence=["Bukti foto jalan rusak"],
            warnings=[],
            needs_human_review=False,
        )

    monkeypatch.setattr(GeminiProvider, "analyze", mock_analyze)


@pytest.fixture
def ai_test_setup(db_session):
    """Fixture untuk menyiapkan data user, kategori, dan report awal untuk testing AI Analysis."""
    citizen = User(
        nama="Citizen User",
        nik="3524011205900001",
        email="citizen_ai@example.com",
        nomor_hp="081299991111",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    verifier = User(
        nama="Verifier User",
        nik="3524011205900002",
        email="verifier_ai@example.com",
        nomor_hp="081299992222",
        password_hash=hash_password("Password123!"),
        role=UserRole.VERIFIER,
    )
    officer = User(
        nama="Officer User",
        nik="3524011205900003",
        email="officer_ai@example.com",
        nomor_hp="081299993333",
        password_hash=hash_password("Password123!"),
        role=UserRole.OFFICER,
    )
    admin = User(
        nama="Admin User",
        nik="3524011205900004",
        email="admin_ai@example.com",
        nomor_hp="081299994444",
        password_hash=hash_password("Password123!"),
        role=UserRole.ADMIN,
    )
    cat = ReportCategory(
        nama_kategori="Jalan Berlubang",
        default_priority=ReportPriority.HIGH,
        is_active=True,
    )
    db_session.add_all([citizen, verifier, officer, admin, cat])
    db_session.flush()

    report = Report(
        nomor_laporan="SIGAP-20261004-0001",
        citizen_id=citizen.id,
        category_id=cat.id,
        deskripsi="Laporan pengaduan jalan berlubang di dekat alun-alun.",
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
        "verifier": verifier,
        "officer": officer,
        "admin": admin,
        "category": cat,
        "report": report,
        "token_citizen": create_access_token({"sub": str(citizen.id), "role": citizen.role.value}),
        "token_verifier": create_access_token({"sub": str(verifier.id), "role": verifier.role.value}),
        "token_officer": create_access_token({"sub": str(officer.id), "role": officer.role.value}),
        "token_admin": create_access_token({"sub": str(admin.id), "role": admin.role.value}),
    }


def test_build_category_priority_prompt(ai_test_setup):
    """
    Verifikasi unit test prompt builder:
    Memastikan deskripsi laporan, nomor laporan, dan kategori valid masuk ke prompt string.
    """
    setup = ai_test_setup
    report = setup["report"]
    cat = setup["category"]

    prompt = build_category_priority_prompt(report, [cat])

    assert report.deskripsi in prompt
    assert report.nomor_laporan in prompt
    assert cat.nama_kategori in prompt
    assert "suggested_category" in prompt
    assert "suggested_priority" in prompt


def test_get_or_trigger_ai_analysis_flow(client: TestClient, ai_test_setup, db_session):
    """
    Verifikasi 1 & 3:
    1. GET /ai-analysis pertama kali mengembalikan status PENDING (lalu background task menyelesaikannya jadi COMPLETED).
    2. GET /ai-analysis kedua mengembalikan record COMPLETED yang sama tanpa memicu re-analysis.
    """
    setup = ai_test_setup
    report_id = setup["report"].id
    headers = {"Authorization": f"Bearer {setup['token_verifier']}"}

    # 1. GET Pertama kali (belum ada analisis)
    res1 = client.get(f"/api/v1/reports/{report_id}/ai-analysis", headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["report_id"] == report_id
    first_id = data1["id"]

    # 2. Cek DB setelah background task selesai
    db_session.expire_all()
    analysis_in_db = db_session.query(AIAnalysis).filter(AIAnalysis.id == first_id).first()
    assert analysis_in_db is not None
    assert analysis_in_db.status == AIAnalysisStatus.COMPLETED
    assert analysis_in_db.summary == "Analisis AI belum diimplementasikan (Phase 7)."

    # 3. GET Kedua kali (sudah COMPLETED)
    res2 = client.get(f"/api/v1/reports/{report_id}/ai-analysis", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == first_id
    assert data2["status"] == "COMPLETED"
    assert data2["created_at"] == data1["created_at"]

    # Pastikan jumlah row AIAnalysis untuk report ini di DB tetap 1
    count = db_session.query(AIAnalysis).filter(AIAnalysis.report_id == report_id).count()
    assert count == 1


def test_consecutive_get_prevents_duplicate_pending_rows(ai_test_setup, db_session):
    """
    Verifikasi 2:
    Pemanggilan get_or_trigger_analysis berturut-turut dengan cepat (sebelum background task pertama selesai)
    TIDAK membuat dua row PENDING terpisah.
    """
    setup = ai_test_setup
    report_id = setup["report"].id
    ai_service = AIAnalysisService()

    class MockBackgroundTasks:
        def __init__(self):
            self.tasks = []

        def add_task(self, func, *args, **kwargs):
            self.tasks.append((func, args, kwargs))

    mock_bg_tasks = MockBackgroundTasks()

    import asyncio

    ans1 = asyncio.run(ai_service.get_or_trigger_analysis(db_session, report_id, mock_bg_tasks))
    assert ans1.status == AIAnalysisStatus.PENDING

    ans2 = asyncio.run(ai_service.get_or_trigger_analysis(db_session, report_id, mock_bg_tasks))
    assert ans2.status == AIAnalysisStatus.PENDING
    assert ans2.id == ans1.id

    count = db_session.query(AIAnalysis).filter(AIAnalysis.report_id == report_id).count()
    assert count == 1


def test_force_reanalyze_creates_new_row(client: TestClient, ai_test_setup, db_session):
    """
    Verifikasi 4:
    POST /reanalyze pada laporan yang sudah COMPLETED membuat row baru PENDING (lalu COMPLETED),
    sedangkan row lama tetap ada di DB (immutable).
    """
    setup = ai_test_setup
    report_id = setup["report"].id
    headers = {"Authorization": f"Bearer {setup['token_verifier']}"}

    client.get(f"/api/v1/reports/{report_id}/ai-analysis", headers=headers)
    db_session.expire_all()
    first_analysis = (
        db_session.query(AIAnalysis)
        .filter(AIAnalysis.report_id == report_id)
        .order_by(AIAnalysis.id.asc())
        .first()
    )
    assert first_analysis.status == AIAnalysisStatus.COMPLETED
    first_id = first_analysis.id

    res_reanalyze = client.post(
        f"/api/v1/reports/{report_id}/ai-analysis/reanalyze", headers=headers
    )
    assert res_reanalyze.status_code == 200
    data_reanalyze = res_reanalyze.json()
    new_id = data_reanalyze["id"]
    assert new_id != first_id

    db_session.expire_all()
    all_analyses = (
        db_session.query(AIAnalysis)
        .filter(AIAnalysis.report_id == report_id)
        .order_by(AIAnalysis.id.asc())
        .all()
    )
    assert len(all_analyses) == 2
    assert all_analyses[0].id == first_id
    assert all_analyses[0].status == AIAnalysisStatus.COMPLETED
    assert all_analyses[1].id == new_id
    assert all_analyses[1].status == AIAnalysisStatus.COMPLETED


def test_rbac_access_control(client: TestClient, ai_test_setup):
    """
    Verifikasi 5:
    Role CITIZEN dan OFFICER dilarang memanggil GET dan POST ai-analysis (403 Forbidden).
    Role VERIFIER dan ADMIN diizinkan (200 OK).
    """
    setup = ai_test_setup
    report_id = setup["report"].id

    headers_citizen = {"Authorization": f"Bearer {setup['token_citizen']}"}
    headers_officer = {"Authorization": f"Bearer {setup['token_officer']}"}
    headers_verifier = {"Authorization": f"Bearer {setup['token_verifier']}"}
    headers_admin = {"Authorization": f"Bearer {setup['token_admin']}"}

    # CITIZEN -> 403
    res_cit_get = client.get(
        f"/api/v1/reports/{report_id}/ai-analysis", headers=headers_citizen
    )
    assert res_cit_get.status_code == 403

    # OFFICER -> 403
    res_off_get = client.get(
        f"/api/v1/reports/{report_id}/ai-analysis", headers=headers_officer
    )
    assert res_off_get.status_code == 403

    # VERIFIER -> 200
    res_ver = client.get(f"/api/v1/reports/{report_id}/ai-analysis", headers=headers_verifier)
    assert res_ver.status_code == 200

    # ADMIN -> 200
    res_adm = client.post(
        f"/api/v1/reports/{report_id}/ai-analysis/reanalyze", headers=headers_admin
    )
    assert res_adm.status_code == 200


def test_background_task_failure_handling(ai_test_setup, db_session):
    """
    Verifikasi 6:
    Simulasi exception saat provider memproses analisis -> row diubah menjadi status FAILED
    dengan pesan error di warnings, dan exception dibungkus secara aman (worker tidak crash).
    """
    setup = ai_test_setup
    report_id = setup["report"].id

    new_analysis = AIAnalysis(
        report_id=report_id,
        model_name="gemini-3.1-flash-lite",
        analysis_type=AnalysisType.CATEGORY_PRIORITY_SUGGESTION.value,
        confidence=0.0,
        summary="Testing failure",
        evidence=[],
        warnings=[],
        needs_human_review=True,
        status=AIAnalysisStatus.PENDING,
    )
    db_session.add(new_analysis)
    db_session.commit()

    import asyncio

    with patch.object(
        GeminiProvider,
        "analyze",
        new=AsyncMock(side_effect=RuntimeError("Koneksi Gemini Timeout")),
    ):
        asyncio.run(run_analysis_job(report_id, new_analysis.id))

    db_session.expire_all()
    failed_analysis = db_session.query(AIAnalysis).filter(AIAnalysis.id == new_analysis.id).first()
    assert failed_analysis is not None
    assert failed_analysis.status == AIAnalysisStatus.FAILED
    assert len(failed_analysis.warnings) == 1
    assert "Gagal menghasilkan analisis: Koneksi Gemini Timeout" in failed_analysis.warnings[0]


def test_ai_analysis_report_not_found(client: TestClient, ai_test_setup):
    """
    Verifikasi 7:
    GET & POST ke report_id yang tidak ada mengembalikan 404 Not Found.
    """
    setup = ai_test_setup
    headers = {"Authorization": f"Bearer {setup['token_verifier']}"}
    non_existent_id = 99999

    res_get = client.get(f"/api/v1/reports/{non_existent_id}/ai-analysis", headers=headers)
    assert res_get.status_code == 404

    res_post = client.post(
        f"/api/v1/reports/{non_existent_id}/ai-analysis/reanalyze", headers=headers
    )
    assert res_post.status_code == 404


def test_get_ai_provider_factory():
    """
    Verifikasi 8:
    get_ai_provider() mengembalikan GeminiProvider jika AI_PROVIDER='gemini',
    dan melempar ConfigurationError jika provider tidak dikenal.
    """
    with patch.object(settings, "AI_PROVIDER", "gemini"):
        provider = get_ai_provider()
        assert isinstance(provider, GeminiProvider)

    with patch.object(settings, "AI_PROVIDER", "unsupported_provider"):
        with pytest.raises(ConfigurationError) as exc_info:
            get_ai_provider()
        assert "tidak dikenal" in exc_info.value.message
