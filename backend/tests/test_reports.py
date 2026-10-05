"""
Unit & Integration Tests untuk Reports CRUD, Dynamic Fields, Upload, & Authorization (Phase 4).
"""

import io
import json
import pytest

from app.core.security import create_access_token, hash_password
from app.models.category_field import CategoryField
from app.models.enums import ReportPriority, UserRole
from app.models.report_category import ReportCategory
from app.models.user import User


@pytest.fixture
def test_data(db_session):
    citizen1 = User(
        nama="Citizen Satu",
        nik="3524011205900010",
        email="citizen1@example.com",
        nomor_hp="081211110001",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    citizen2 = User(
        nama="Citizen Dua",
        nik="3524011205900020",
        email="citizen2@example.com",
        nomor_hp="081211110002",
        password_hash=hash_password("Password123!"),
        role=UserRole.CITIZEN,
    )
    db_session.add_all([citizen1, citizen2])
    db_session.flush()

    cat = ReportCategory(
        nama_kategori="Jalan Rusak",
        default_priority=ReportPriority.HIGH,
        is_active=True,
    )
    db_session.add(cat)
    db_session.flush()

    field_req = CategoryField(
        category_id=cat.id,
        field_name="jenis_kerusakan",
        field_type="select",
        is_required=True,
    )
    db_session.add(field_req)
    db_session.commit()

    return {
        "user1": citizen1,
        "user2": citizen2,
        "category": cat,
    }


VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00\x60\x00\x60\x00\x00\xff\xfe"


def test_create_report_success(client, test_data):
    """Test sukses membuat laporan baru (validasi dynamic field, upload file, nomor laporan, status history)."""
    user = test_data["user1"]
    cat = test_data["category"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    fake_image = io.BytesIO(VALID_JPEG_BYTES)
    response = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan jalan rusak berlubang sangat membahayakan pengendara motor.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Panglima Sudirman No. 45, Lamongan",
            "dynamic_fields": json.dumps({"jenis_kerusakan": "Berlubang Parah"}),
        },
        files=[
            ("files", ("foto_bukti1.jpg", fake_image, "image/jpeg")),
        ],
    )
    assert response.status_code == 201
    data = response.json()

    assert data["nomor_laporan"].startswith("SIGAP-2026-")
    assert data["status_raw"] == "PENDING_VERIFICATION"
    assert data["status_tracking"] == "Menunggu Verifikasi"
    assert data["priority"] == "HIGH"
    assert len(data["evidences"]) == 1
    assert data["evidences"][0]["url"].startswith("/api/v1/uploads/")
    assert len(data["field_values"]) == 1
    assert data["field_values"][0]["field_name"] == "jenis_kerusakan"
    assert data["field_values"][0]["value"] == "Berlubang Parah"


def test_create_report_unrecognized_dynamic_field(client, test_data):
    """Test penolakan (422/400) bila dikirimkan dynamic field yang tidak dikenal untuk kategori tersebut."""
    user = test_data["user1"]
    cat = test_data["category"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    fake_image = io.BytesIO(VALID_JPEG_BYTES)
    response = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan jalan rusak dengan field asing.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Lamongan",
            "dynamic_fields": json.dumps({"field_asing_kategori_lain": "Nilai"}),
        },
        files=[
            ("files", ("foto_bukti.jpg", fake_image, "image/jpeg")),
        ],
    )
    assert response.status_code in (400, 422)
    assert "tidak dikenal" in response.json()["detail"]


def test_create_report_missing_required_field(client, test_data):
    """Test penolakan (422/400) jika field wajib kategori tidak diisi."""
    user = test_data["user1"]
    cat = test_data["category"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    fake_image = io.BytesIO(VALID_JPEG_BYTES)
    response = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Deskripsi pengaduan tanpa mengisi jenis_kerusakan.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Lamongan",
            "dynamic_fields": json.dumps({}),
        },
        files=[
            ("files", ("foto_bukti.jpg", fake_image, "image/jpeg")),
        ],
    )
    assert response.status_code in (400, 422)
    assert "jenis_kerusakan" in response.json()["detail"]


def test_create_report_invalid_file_type(client, test_data):
    """Test penolakan file bukan gambar (.txt)."""
    user = test_data["user1"]
    cat = test_data["category"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    fake_file = io.BytesIO(b"plain text data")
    response = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Deskripsi pengaduan dengan file salah.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Lamongan",
            "dynamic_fields": json.dumps({"jenis_kerusakan": "Berlubang"}),
        },
        files=[
            ("files", ("dokumen.txt", fake_file, "text/plain")),
        ],
    )
    assert response.status_code in (400, 422)
    assert "tidak didukung" in response.json()["detail"]


def test_create_report_forged_file_magic_bytes(client, test_data):
    """Test penolakan file palsu yang di-rename menjadi .jpg namun isinya executable / text (magic bytes mismatch)."""
    user = test_data["user1"]
    cat = test_data["category"]
    token = create_access_token({"sub": str(user.id), "role": user.role.value})

    forged_exe_file = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00\x04\x00 fake windows executable content")
    response = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan dengan file malware dipalsukan jadi jpg.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Lamongan",
            "dynamic_fields": json.dumps({"jenis_kerusakan": "Berlubang"}),
        },
        files=[
            ("files", ("malware.jpg", forged_exe_file, "image/jpeg")),
        ],
    )
    assert response.status_code in (400, 422)
    assert "bukan gambar JPEG/PNG" in response.json()["detail"]


def test_report_ownership_authorization(client, test_data):
    """Test kepemilikan laporan: CITIZEN 2 mengakses laporan CITIZEN 1 mengembalikan 404 Not Found."""
    user1 = test_data["user1"]
    user2 = test_data["user2"]
    cat = test_data["category"]

    token1 = create_access_token({"sub": str(user1.id), "role": user1.role.value})
    token2 = create_access_token({"sub": str(user2.id), "role": user2.role.value})

    fake_image = io.BytesIO(VALID_JPEG_BYTES)
    res_create = client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pribadi user 1.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Lamongan",
            "dynamic_fields": json.dumps({"jenis_kerusakan": "Berlubang"}),
        },
        files=[("files", ("foto.jpg", fake_image, "image/jpeg"))],
    )
    report_id = res_create.json()["id"]

    res_u1 = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res_u1.status_code == 200

    res_u2 = client.get(
        f"/api/v1/reports/{report_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert res_u2.status_code == 404
    assert res_u2.json()["detail"] == "Laporan tidak ditemukan"


def test_get_my_reports_pagination(client, test_data):
    """Test endpoint GET /api/v1/reports/me terpaginasi dengan benar."""
    user1 = test_data["user1"]
    cat = test_data["category"]
    token1 = create_access_token({"sub": str(user1.id), "role": user1.role.value})

    for i in range(2):
        fake_img = io.BytesIO(VALID_JPEG_BYTES)
        client.post(
            "/api/v1/reports",
            headers={"Authorization": f"Bearer {token1}"},
            data={
                "category_id": cat.id,
                "deskripsi": f"Laporan pengaduan ke-{i+1} milik user 1.",
                "waktu_kejadian": "2026-09-24T08:00:00",
                "latitude": "-7.1189",
                "longitude": "112.4150",
                "alamat_lokasi": "Jl. Raya Lamongan",
                "dynamic_fields": json.dumps({"jenis_kerusakan": "Berlubang"}),
            },
            files=[("files", (f"foto{i}.jpg", fake_img, "image/jpeg"))],
        )

    res_page = client.get(
        "/api/v1/reports/me?page=1&page_size=1",
        headers={"Authorization": f"Bearer {token1}"},
    )
    assert res_page.status_code == 200
    data = res_page.json()
    assert data["total"] == 2
    assert len(data["items"]) == 1
    assert data["page"] == 1
    assert data["total_pages"] == 2


def test_get_reports_nearby(client, test_data):
    """Test endpoint GET /api/v1/reports/nearby."""
    user1 = test_data["user1"]
    cat = test_data["category"]
    token1 = create_access_token({"sub": str(user1.id), "role": user1.role.value})

    fake_img = io.BytesIO(VALID_JPEG_BYTES)
    client.post(
        "/api/v1/reports",
        headers={"Authorization": f"Bearer {token1}"},
        data={
            "category_id": cat.id,
            "deskripsi": "Laporan pengaduan di Lamongan.",
            "waktu_kejadian": "2026-09-24T08:00:00",
            "latitude": "-7.1189",
            "longitude": "112.4150",
            "alamat_lokasi": "Jl. Raya Lamongan",
            "dynamic_fields": json.dumps({"jenis_kerusakan": "Berlubang"}),
        },
        files=[("files", ("foto.jpg", fake_img, "image/jpeg"))],
    )

    # Search nearby radius 5km
    res = client.get("/api/v1/reports/nearby?lat=-7.1189&lng=112.4150&radius=5")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 1
    assert items[0]["nomor_laporan"].startswith("SIGAP-2026-")
    assert items[0]["latitude"] == -7.1189
    assert items[0]["longitude"] == 112.415

