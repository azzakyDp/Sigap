"""
Unit & Integration Tests untuk Report Workflow & State Transitions (Phase 5).
"""

import io
import json
import pytest

from app.core.security import create_access_token, hash_password
from app.models.category_field import CategoryField
from app.models.enums import ReportPriority, UserRole
from app.models.report_assignment import ReportAssignment
from app.models.report_category import ReportCategory
from app.models.user import User

VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xff\xfe"


@pytest.fixture
def workflow_users(db_session):
    citizen = User(
        nama="Citizen Terdaftar",
        nik="3524011205900099",
        email="citizen_wf@example.com",
        nomor_hp="081299990001",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    verifier = User(
        nama="Verifier Petugas",
        nik="3524011205900088",
        email="verifier_wf@example.com",
        nomor_hp="081299990002",
        password_hash=hash_password("Password123!"),
        role=UserRole.VERIFIER,
    )
    officer1 = User(
        nama="Petugas Lapangan 1",
        nik="3524011205900077",
        email="officer1_wf@example.com",
        nomor_hp="081299990003",
        password_hash=hash_password("Password123!"),
        role=UserRole.OFFICER,
    )
    officer2 = User(
        nama="Petugas Lapangan 2",
        nik="3524011205900066",
        email="officer2_wf@example.com",
        nomor_hp="081299990004",
        password_hash=hash_password("Password123!"),
        role=UserRole.OFFICER,
    )
    cat = ReportCategory(
        nama_kategori="Jalan Berlubang",
        default_priority=ReportPriority.HIGH,
        is_active=True,
    )
    db_session.add_all([citizen, verifier, officer1, officer2, cat])
    db_session.flush()

    field = CategoryField(
        category_id=cat.id,
        field_name="kedalaman",
        field_type="text",
        is_required=True,
    )
    db_session.add(field)
    db_session.commit()

    return {
        "citizen": citizen,
        "verifier": verifier,
        "officer1": officer1,
        "officer2": officer2,
        "category": cat,
        "token_citizen": create_access_token({"sub": str(citizen.id), "role": citizen.role.value}),
        "token_verifier": create_access_token({"sub": str(verifier.id), "role": verifier.role.value}),
        "token_officer1": create_access_token({"sub": str(officer1.id), "role": officer1.role.value}),
        "token_officer2": create_access_token({"sub": str(officer2.id), "role": officer2.role.value}),
    }


def test_full_report_workflow_end_to_end(client, workflow_users):
    """
    Test alur penuh pengaduan laporan end-to-end:
    Create (Citizen) -> Verify (Verifier) -> Assign (Verifier) -> Start Handling (Officer1) ->
    Action Report (Officer1) -> Resolve (Officer1) -> Close (Verifier).
    """
    w = workflow_users
    cat = w["category"]

    # 1. CREATE REPORT (Citizen)
    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan jalan berlubang di dekat alun-alun.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Alun-alun Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "15cm"}),
        },
        files=[("files", ("foto1.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    assert res_create.status_code == 201
    report_id = res_create.json()["id"]
    assert res_create.json()["status_raw"] == "PENDING_VERIFICATION"
    assert res_create.json()["status_tracking"] == "Menunggu Verifikasi"

    # 2. VERIFY REPORT (Verifier) -> VERIFIED
    res_verify = client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED", "catatan": "Laporan valid, disetujui."},
    )
    assert res_verify.status_code == 200
    assert res_verify.json()["status_raw"] == "VERIFIED"
    assert res_verify.json()["status_tracking"] == "Diverifikasi"

    # 3. ASSIGN REPORT (Verifier) -> ASSIGNED to Officer 1
    res_assign = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id, "catatan": "Tolong segera ke lokasi."},
    )
    assert res_assign.status_code == 200
    assert res_assign.json()["status_raw"] == "ASSIGNED"
    assert res_assign.json()["status_tracking"] == "Diverifikasi"

    # 4. START HANDLING (Officer 1) -> IN_PROGRESS
    res_start = client.patch(
        f"/api/v1/reports/{report_id}/start-handling",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
    )
    assert res_start.status_code == 200
    assert res_start.json()["status_raw"] == "IN_PROGRESS"
    assert res_start.json()["status_tracking"] == "Dalam Penanganan"

    # 5. ACTION REPORT (Officer 1)
    res_action = client.post(
        f"/api/v1/reports/{report_id}/action-reports",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
        json={
            "jenis_tindakan": "Penambalan Aspal Sementara",
            "deskripsi": "Telah dilakukan penambalan aspal dingin di titik lubang utama.",
            "waktu_kedatangan": "2026-09-24T10:00:00",
            "waktu_selesai": "2026-09-24T11:30:00",
            "hasil": "Jalan sudah rata dan aman dilalui kendaraan.",
        },
    )
    assert res_action.status_code == 201
    assert res_action.json()["jenis_tindakan"] == "Penambalan Aspal Sementara"

    # 6. RESOLVE REPORT (Officer 1) -> RESOLVED
    res_resolve = client.patch(
        f"/api/v1/reports/{report_id}/resolve",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
        json={"decision": "RESOLVED", "catatan": "Penanganan selesai dengan baik."},
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["status_raw"] == "RESOLVED"
    assert res_resolve.json()["status_tracking"] == "Selesai"

    # 7. CLOSE REPORT (Verifier) -> CLOSED
    res_close = client.patch(
        f"/api/v1/reports/{report_id}/close",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"catatan": "Kasus selesai dan ditutup."},
    )
    assert res_close.status_code == 200
    assert res_close.json()["status_raw"] == "CLOSED"
    assert res_close.json()["status_tracking"] == "Selesai"

    # Verifikasi riwayat status (Status Histories) tercatat lengkap
    histories = res_close.json()["status_histories"]
    assert len(histories) >= 5  # PENDING_VERIFICATION, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED


def test_transition_guard_violations(client, workflow_users):
    """Test aturan guard transisi ilegal (mis. assign laporan belum terverifikasi, resolve belum in_progress)."""
    w = workflow_users
    cat = w["category"]

    # Buat laporan baru (PENDING_VERIFICATION)
    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan baru belum verifikasi.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    # 1. Coba Assign sebelum VERIFIED -> 400/422 Unprocessable Entity
    res_illegal_assign = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )
    assert res_illegal_assign.status_code in (400, 422)
    assert "tidak dapat ditugaskan" in res_illegal_assign.json()["detail"]

    # 2. Coba Start Handling sebelum ASSIGNED -> 400/422
    res_illegal_start = client.patch(
        f"/api/v1/reports/{report_id}/start-handling",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
    )
    assert res_illegal_start.status_code in (400, 422)

    # 3. Coba Close sebelum RESOLVED/UNRESOLVED -> 400/422
    res_illegal_close = client.patch(
        f"/api/v1/reports/{report_id}/close",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"catatan": "Tutup paksa"},
    )
    assert res_illegal_close.status_code in (400, 422)


def test_reassignment_is_current_flag(client, workflow_users, db_session):
    """Test reassignment: assignment lama set is_current=False, assignment baru set is_current=True."""
    w = workflow_users
    cat = w["category"]

    # Create & Verify
    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan untuk test reassignment.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED"},
    )

    # 1. Assign ke Officer 1
    client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id, "catatan": "Assignment 1"},
    )

    # 2. Reassign ke Officer 2
    client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer2"].id, "catatan": "Reassignment ke Officer 2"},
    )

    # Verifikasi DB: Harus ada 2 assignment, 1 non-aktif (Officer 1) dan 1 aktif (Officer 2)
    assignments = db_session.query(ReportAssignment).filter_by(report_id=report_id).all()
    assert len(assignments) == 2

    current_assignments = [a for a in assignments if a.is_current]
    assert len(current_assignments) == 1
    assert current_assignments[0].officer_id == w["officer2"].id


def test_cross_role_authorization_guards(client, workflow_users):
    """Test otorisasi silang role: Officer tidak bisa verify, Citizen tidak bisa assign, dst."""
    w = workflow_users
    cat = w["category"]

    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan test auth silang.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    # Officer mencoba verify -> 403 Forbidden
    res_off_verify = client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
        json={"decision": "VERIFIED"},
    )
    assert res_off_verify.status_code == 403

    # Citizen mencoba assign -> 403 Forbidden
    res_cit_assign = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        json={"officer_id": w["officer1"].id},
    )
    assert res_cit_assign.status_code == 403


def test_action_report_waktu_selesai_optional(client, workflow_users):
    """Test action report dengan waktu_selesai=None (tindakan masih berlangsung)."""
    w = workflow_users
    cat = w["category"]

    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan untuk test action report ongoing.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED"},
    )
    client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )
    client.patch(
        f"/api/v1/reports/{report_id}/start-handling",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
    )

    # Action Report 1: waktu_selesai = None
    res_action1 = client.post(
        f"/api/v1/reports/{report_id}/action-reports",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
        json={
            "jenis_tindakan": "Pemasangan Barikade / Signage",
            "deskripsi": "Petugas tiba di lokasi dan langsung memasang barikade pengaman.",
            "waktu_kedatangan": "2026-09-24T10:00:00",
            "waktu_selesai": None,
            "hasil": "Area bahaya telah diberi tanda pengaman.",
        },
    )
    assert res_action1.status_code == 201
    assert res_action1.json()["waktu_selesai"] is None


def test_verify_duplicate_validations(client, workflow_users):
    """Test validasi keputusan DUPLICATE (wajib duplicate_of_report_id, tidak boleh merujuk diri sendiri)."""
    w = workflow_users
    cat = w["category"]

    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan duplikat test.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    # 1. Decision DUPLICATE tanpa duplicate_of_report_id -> 422 Unprocessable Entity
    res1 = client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "DUPLICATE", "duplicate_of_report_id": None},
    )
    assert res1.status_code == 422

    # 2. Decision DUPLICATE merujuk ke diri sendiri -> 400 Bad Request
    res2 = client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "DUPLICATE", "duplicate_of_report_id": report_id},
    )
    assert res2.status_code in (400, 422)

    # 3. Decision DUPLICATE merujuk ke report yang tidak ada -> 400 Bad Request
    res3 = client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "DUPLICATE", "duplicate_of_report_id": 999999},
    )
    assert res3.status_code in (400, 422)


def test_assign_same_officer_fails(client, workflow_users):
    """Test pencegahan penugasan ulang (no-op reassign) ke officer yang sama."""
    w = workflow_users
    cat = w["category"]

    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan test reassign officer sama.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED"},
    )
    client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )

    # Assign ulang ke Officer 1 lagi -> 400 Bad Request
    res_reassign_same = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )
    assert res_reassign_same.status_code in (400, 422)
    assert "sudah ditugaskan" in res_reassign_same.json()["detail"]


def test_reassign_unresolved_report(client, workflow_users):
    """Test bahwa laporan berstatus UNRESOLVED dapat ditugaskan kembali (reassign) ke officer lain."""
    w = workflow_users
    cat = w["category"]

    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan unresolved reassign test.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED"},
    )
    client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )
    client.patch(
        f"/api/v1/reports/{report_id}/start-handling",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
    )
    client.patch(
        f"/api/v1/reports/{report_id}/resolve",
        headers={"Authorization": f"Bearer {w['token_officer1']}"},
        json={"decision": "UNRESOLVED", "catatan": "Butuh tim/peralatan berat tambahan."},
    )

    # Reassign UNRESOLVED report ke Officer 2
    res_reassign = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer2"].id, "catatan": "Penugasan ulang ke tim 2 dengan alat berat."},
    )
    assert res_reassign.status_code == 200
    assert res_reassign.json()["status_raw"] == "ASSIGNED"


def test_concurrent_assignment(client, workflow_users, db_session):
    """Test proteksi assignment dan penguncian row (get_by_id_for_update) untuk keamanan status DB."""
    from app.repositories.report_repository import ReportRepository

    w = workflow_users
    cat = w["category"]

    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan untuk test concurrency assignment.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED"},
    )

    # Verifikasi metode row lock get_by_id_for_update
    locked_report = ReportRepository.get_by_id_for_update(db_session, report_id)
    assert locked_report is not None
    assert locked_report.id == report_id

    # 1. Assignment pertama ke Officer 1
    res1 = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )
    assert res1.status_code == 200

    # 2. Assignment kedua ke Officer 2 (reassignment)
    res2 = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer2"].id},
    )
    assert res2.status_code == 200

    # Memastikan status DB tetap memiliki TEPAT SATU assignment aktif (is_current=True)
    assignments = db_session.query(ReportAssignment).filter_by(report_id=report_id, is_current=True).all()
    assert len(assignments) == 1
    assert assignments[0].officer_id == w["officer2"].id


def test_current_assignment_in_report_detail(client, workflow_users):
    """Test field current_assignment pada ReportDetailResponse (null jika belum diassign, terisi setelah diassign)."""
    w = workflow_users
    cat = w["category"]

    # 1. Create Report
    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {w['token_citizen']}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan untuk test field current_assignment.",
            "waktu_kejadian": "2026-09-24T09:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Lamongan",
            "dynamic_fields": json.dumps({"kedalaman": "10cm"}),
        },
        files=[("files", ("foto.jpg", io.BytesIO(VALID_JPEG_BYTES), "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    # 2. Get Detail (Belum diassign -> current_assignment must be None)
    res_detail1 = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
    )
    assert res_detail1.status_code == 200
    assert res_detail1.json()["current_assignment"] is None

    # 3. Verify & Assign
    client.patch(
        f"/api/v1/reports/{report_id}/verify",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"decision": "VERIFIED"},
    )
    res_assign = client.post(
        f"/api/v1/reports/{report_id}/assign",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
        json={"officer_id": w["officer1"].id},
    )
    assert res_assign.status_code == 200
    assert res_assign.json()["current_assignment"] is not None
    assert res_assign.json()["current_assignment"]["officer_id"] == w["officer1"].id
    assert res_assign.json()["current_assignment"]["officer_nama"] == w["officer1"].nama
    assert "assigned_at" in res_assign.json()["current_assignment"]

    # 4. Get Detail lagi (Sudah diassign -> current_assignment terisi)
    res_detail2 = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {w['token_verifier']}"},
    )
    assert res_detail2.status_code == 200
    assert res_detail2.json()["current_assignment"] is not None
    assert res_detail2.json()["current_assignment"]["officer_id"] == w["officer1"].id
    assert res_detail2.json()["current_assignment"]["officer_nama"] == w["officer1"].nama



