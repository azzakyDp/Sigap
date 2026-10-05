"""
Unit & Integration Tests untuk Dashboard & Agregasi Verifier/Admin Phase 8.
"""

from datetime import date, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, hash_password
from app.models.ai_analysis import AIAnalysis
from app.models.enums import AIAnalysisStatus, ReportPriority, ReportStatus, UserRole
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.models.user import User
from scripts.seed_categories import seed as seed_categories
from scripts.seed_report_dataset import seed_dataset
from scripts.seed_staff_accounts import seed_staff as seed_staff_accounts


@pytest.fixture
def dashboard_setup(db_session):
    """Fixture menyiapkan akun verifier, admin, citizen, officer, serta 1 kategori."""
    citizen = User(
        nama="Citizen Dashboard",
        nik="3524011205990001",
        email="citizen_dash@example.com",
        nomor_hp="081299990001",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    verifier = User(
        nama="Verifier Dashboard",
        nik="3524011205990002",
        email="verifier_dash@example.com",
        nomor_hp="081299990002",
        password_hash=hash_password("Password123!"),
        role=UserRole.VERIFIER,
    )
    officer = User(
        nama="Officer Dashboard",
        nik="3524011205990003",
        email="officer_dash@example.com",
        nomor_hp="081299990003",
        password_hash=hash_password("Password123!"),
        role=UserRole.OFFICER,
    )
    admin = User(
        nama="Admin Dashboard",
        nik="3524011205990004",
        email="admin_dash@example.com",
        nomor_hp="081299990004",
        password_hash=hash_password("Password123!"),
        role=UserRole.ADMIN,
    )
    cat = ReportCategory(
        nama_kategori="Lampu Lalu Lintas Padam",
        default_priority=ReportPriority.URGENT,
        is_active=True,
    )
    db_session.add_all([citizen, verifier, officer, admin, cat])
    db_session.commit()

    verifier_token = create_access_token(data={"sub": str(verifier.id), "role": verifier.role.value})
    admin_token = create_access_token(data={"sub": str(admin.id), "role": admin.role.value})
    citizen_token = create_access_token(data={"sub": str(citizen.id), "role": citizen.role.value})
    officer_token = create_access_token(data={"sub": str(officer.id), "role": officer.role.value})

    return {
        "citizen": citizen,
        "verifier": verifier,
        "officer": officer,
        "admin": admin,
        "category": cat,
        "verifier_headers": {"Authorization": f"Bearer {verifier_token}"},
        "admin_headers": {"Authorization": f"Bearer {admin_token}"},
        "citizen_headers": {"Authorization": f"Bearer {citizen_token}"},
        "officer_headers": {"Authorization": f"Bearer {officer_token}"},
    }


def test_dashboard_summary_with_seed_dataset(client: TestClient, db_session, dashboard_setup):
    """
    1. Test /dashboard/summary setelah dataset seeding:
    - total_reports cocok dengan jumlah row di DB
    - sum(by_status.values()) == total_reports
    - sum(by_priority.values()) == total_reports
    """
    seed_categories()
    seed_staff_accounts()
    seed_dataset(total_count=30, reset=True)

    headers = dashboard_setup["verifier_headers"]
    response = client.get("/api/v1/dashboard/summary", headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()

    db_total = db_session.query(Report).count()
    assert data["total_reports"] == db_total
    assert sum(data["by_status"].values()) == data["total_reports"]
    assert sum(data["by_priority"].values()) == data["total_reports"]
    assert "needs_attention_count" in data


def test_dashboard_trend_daily_and_weekly(client: TestClient, db_session, dashboard_setup):
    """
    2. Test /dashboard/trend dengan granularity=daily dan weekly.
    """
    seed_categories()
    seed_staff_accounts()
    seed_dataset(total_count=30, reset=True)

    headers = dashboard_setup["verifier_headers"]
    today_str = date.today().isoformat()
    start_str = (date.today() - timedelta(days=120)).isoformat()

    # Daily
    res_daily = client.get(
        f"/api/v1/dashboard/trend?granularity=daily&start_date={start_str}&end_date={today_str}",
        headers=headers,
    )
    assert res_daily.status_code == 200, res_daily.text
    daily_data = res_daily.json()
    assert daily_data["granularity"] == "daily"
    assert len(daily_data["data"]) > 0

    # Weekly
    res_weekly = client.get(
        f"/api/v1/dashboard/trend?granularity=weekly&start_date={start_str}&end_date={today_str}",
        headers=headers,
    )
    assert res_weekly.status_code == 200, res_weekly.text
    weekly_data = res_weekly.json()
    assert weekly_data["granularity"] == "weekly"
    assert len(weekly_data["data"]) > 0


def test_dashboard_trend_exceeds_180_days_rejected(client: TestClient, dashboard_setup):
    """
    3. Test /dashboard/trend dengan rentang > 180 hari ditolak dengan HTTP 400.
    """
    headers = dashboard_setup["verifier_headers"]
    start_str = (date.today() - timedelta(days=200)).isoformat()
    today_str = date.today().isoformat()

    response = client.get(
        f"/api/v1/dashboard/trend?start_date={start_str}&end_date={today_str}",
        headers=headers,
    )
    assert response.status_code == 400
    assert "180 hari" in response.json()["detail"]


def test_dashboard_needs_attention_ai_flagged(client: TestClient, db_session, dashboard_setup):
    """
    4. Test /dashboard/needs-attention untuk laporan dengan AIAnalysis needs_human_review=True.
    """
    headers = dashboard_setup["verifier_headers"]
    citizen = dashboard_setup["citizen"]
    cat = dashboard_setup["category"]

    report = Report(
        nomor_laporan="SIGAP-AI-FLAG-001",
        citizen_id=citizen.id,
        category_id=cat.id,
        deskripsi="Laporan dengan AI flagged review",
        waktu_kejadian=datetime.now(),
        latitude=-7.12,
        longitude=112.38,
        alamat_lokasi="Jl. Merdeka",
        status=ReportStatus.VERIFIED,
        priority=ReportPriority.HIGH,
    )
    db_session.add(report)
    db_session.flush()

    ai_analysis = AIAnalysis(
        report_id=report.id,
        model_name="gemini-3.1-flash-lite",
        analysis_type="CATEGORY_PRIORITY",
        status=AIAnalysisStatus.COMPLETED,
        suggested_category="Lampu Padam",
        suggested_priority="HIGH",
        confidence=0.75,
        summary="Kategori berbeda dari klaim",
        evidence=["Bukti foto"],
        warnings=["Perbedaan kategori"],
        needs_human_review=True,
    )
    db_session.add(ai_analysis)
    db_session.commit()

    response = client.get("/api/v1/dashboard/needs-attention", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] >= 1
    found = [item for item in body["items"] if item["id"] == report.id]
    assert len(found) == 1
    assert found[0]["attention_reason"] in ["ai_flagged", "both"]


def test_dashboard_needs_attention_urgent_sla_breach(client: TestClient, db_session, dashboard_setup):
    """
    5. Test manual 1 laporan URGENT + PENDING_VERIFICATION dengan created_at dipaksa mundur > URGENT_SLA_HOURS.
    """
    headers = dashboard_setup["verifier_headers"]
    citizen = dashboard_setup["citizen"]
    cat = dashboard_setup["category"]

    past_time = datetime.now() - timedelta(hours=settings.URGENT_SLA_HOURS + 1)
    report = Report(
        nomor_laporan="SIGAP-SLA-BREACH-001",
        citizen_id=citizen.id,
        category_id=cat.id,
        deskripsi="Laporan URGENT kadaluarsa SLA",
        waktu_kejadian=past_time,
        created_at=past_time,
        latitude=-7.12,
        longitude=112.38,
        alamat_lokasi="Jl. Ahmad Yani",
        status=ReportStatus.PENDING_VERIFICATION,
        priority=ReportPriority.URGENT,
    )
    db_session.add(report)
    db_session.commit()

    response = client.get("/api/v1/dashboard/needs-attention", headers=headers)
    assert response.status_code == 200, response.text
    body = response.json()
    found = [item for item in body["items"] if item["id"] == report.id]
    assert len(found) == 1
    assert found[0]["attention_reason"] in ["urgent_sla_breach", "both"]


def test_dashboard_endpoints_rbac_denied_for_citizen_and_officer(client: TestClient, dashboard_setup):
    """
    6. Role CITIZEN dan OFFICER memanggil 3 endpoint dashboard -> HTTP 403 Forbidden.
    """
    citizen_headers = dashboard_setup["citizen_headers"]
    officer_headers = dashboard_setup["officer_headers"]

    endpoints = [
        "/api/v1/dashboard/summary",
        "/api/v1/dashboard/trend",
        "/api/v1/dashboard/needs-attention",
    ]

    for ep in endpoints:
        res_cit = client.get(ep, headers=citizen_headers)
        assert res_cit.status_code == 403, f"CITIZEN should be 403 on {ep}"

        res_off = client.get(ep, headers=officer_headers)
        assert res_off.status_code == 403, f"OFFICER should be 403 on {ep}"
