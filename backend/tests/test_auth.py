"""
Unit & Integration Tests untuk Authentication & RBAC (Phase 3).
"""

import pytest
from fastapi import Depends

from app.api.dependencies import require_role
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import UserRole
from app.models.user import User


# Register dummy test endpoints for RBAC verification
@app.get("/api/v1/test/citizen-only")
def dummy_citizen_route(current_user: User = Depends(require_role(UserRole.CITIZEN))):
    return {"message": f"Hello Citizen {current_user.nama}"}


@app.get("/api/v1/test/officer-only")
def dummy_officer_route(current_user: User = Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))):
    return {"message": f"Hello Officer {current_user.nama}"}


def test_register_success(client):
    """Test registrasi sukses dan verifikasi NIK/password_hash TIDAK MUNCUL di response body."""
    payload = {
        "nama": "Budi Santoso",
        "nik": "3524011205900001",
        "email": "budi@example.com",
        "nomor_hp": "081234567890",
        "password": "Password123!",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert data["nama"] == "Budi Santoso"
    assert data["email"] == "budi@example.com"
    assert data["nomor_hp"] == "081234567890"
    assert data["role"] == "CITIZEN"

    assert "nik" not in data, "NIK terekspos di response body registrasi!"
    assert "password_hash" not in data, "password_hash terekspos di response body registrasi!"


def test_register_duplicate_checks(client):
    """Test NIK/email/nomor_hp duplikat ditolak dengan error yang jelas (bukan 500)."""
    payload = {
        "nama": "User Pertama",
        "nik": "3524011205900002",
        "email": "user1@example.com",
        "nomor_hp": "081234567891",
        "password": "Password123!",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # 1. Duplikat NIK
    dup_nik_payload = payload.copy()
    dup_nik_payload["email"] = "other@example.com"
    dup_nik_payload["nomor_hp"] = "081234567899"
    res_nik = client.post("/api/v1/auth/register", json=dup_nik_payload)
    assert res_nik.status_code in (400, 422)
    assert "NIK sudah terdaftar" in res_nik.json()["detail"]

    # 2. Duplikat Email
    dup_email_payload = payload.copy()
    dup_email_payload["nik"] = "3524011205900003"
    dup_email_payload["nomor_hp"] = "081234567899"
    res_email = client.post("/api/v1/auth/register", json=dup_email_payload)
    assert res_email.status_code in (400, 422)
    assert "Email sudah terdaftar" in res_email.json()["detail"]

    # 3. Duplikat Nomor HP
    dup_hp_payload = payload.copy()
    dup_hp_payload["nik"] = "3524011205900003"
    dup_hp_payload["email"] = "other2@example.com"
    res_hp = client.post("/api/v1/auth/register", json=dup_hp_payload)
    assert res_hp.status_code in (400, 422)
    assert "Nomor HP sudah terdaftar" in res_hp.json()["detail"]


def test_login_success(client, db_session):
    """Test login dengan email atau nomor HP."""
    user = User(
        nama="Siti Aminah",
        nik="3524011205900005",
        email="siti@example.com",
        nomor_hp="081299998888",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    db_session.add(user)
    db_session.commit()

    res_email = client.post(
        "/api/v1/auth/login",
        json={"identifier": "siti@example.com", "password": "Password123!"},
    )
    assert res_email.status_code == 200
    token_data = res_email.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == "siti@example.com"

    res_hp = client.post(
        "/api/v1/auth/login",
        json={"identifier": "081299998888", "password": "Password123!"},
    )
    assert res_hp.status_code == 200


def test_login_failure_generic_message(client, db_session):
    """Test login gagal menghasilkan error 401 generik tanpa membocorkan NIK atau eksistensi user."""
    user = User(
        nama="Test User",
        nik="3524011205900006",
        email="testlogin@example.com",
        nomor_hp="081211112222",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    db_session.add(user)
    db_session.commit()

    res_bad_pw = client.post(
        "/api/v1/auth/login",
        json={"identifier": "testlogin@example.com", "password": "WrongPassword!"},
    )
    assert res_bad_pw.status_code == 401
    assert res_bad_pw.json()["detail"] == "Email/nomor HP atau password salah"

    res_no_user = client.post(
        "/api/v1/auth/login",
        json={"identifier": "nonexistent@example.com", "password": "Password123!"},
    )
    assert res_no_user.status_code == 401
    assert res_no_user.json()["detail"] == "Email/nomor HP atau password salah"


def test_rbac_require_role(client, db_session):
    """Test require_role dependency."""
    citizen = User(
        nama="Citizen User",
        nik="3524011205900007",
        email="citizen@example.com",
        nomor_hp="081233334444",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    officer = User(
        nama="Officer User",
        nik="3524011205900008",
        email="officer@example.com",
        nomor_hp="081255556666",
        password_hash=hash_password("Password123!"),
        role=UserRole.OFFICER,
    )
    db_session.add_all([citizen, officer])
    db_session.commit()

    token_citizen = create_access_token({"sub": str(citizen.id), "role": citizen.role.value})
    token_officer = create_access_token({"sub": str(officer.id), "role": officer.role.value})

    res1 = client.get(
        "/api/v1/test/citizen-only",
        headers={"Authorization": f"Bearer {token_citizen}"},
    )
    assert res1.status_code == 200

    res2 = client.get(
        "/api/v1/test/officer-only",
        headers={"Authorization": f"Bearer {token_citizen}"},
    )
    assert res2.status_code == 403

    res3 = client.get(
        "/api/v1/test/officer-only",
        headers={"Authorization": f"Bearer {token_officer}"},
    )
    assert res3.status_code == 200
