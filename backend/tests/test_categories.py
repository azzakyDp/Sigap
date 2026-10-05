"""
Unit & Integration Tests untuk Categories (Phase 4).
"""

import pytest
from app.models.category_field import CategoryField
from app.models.enums import ReportPriority
from app.models.report_category import ReportCategory


@pytest.fixture(autouse=True)
def seed_category_data(db_session):
    cat = ReportCategory(
        nama_kategori="Jalan Rusak / Berlubang",
        default_priority=ReportPriority.HIGH,
        is_active=True,
    )
    db_session.add(cat)
    db_session.flush()

    field = CategoryField(
        category_id=cat.id,
        field_name="jenis_kerusakan",
        field_type="select",
        is_required=True,
    )
    db_session.add(field)
    db_session.commit()


def test_get_categories(client):
    """Test GET /api/v1/categories mengembalikan list kategori aktif dan field dinamisnya."""
    res = client.get("/api/v1/categories")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    cat = data[0]
    assert cat["nama_kategori"] == "Jalan Rusak / Berlubang"
    assert cat["default_priority"] == "HIGH"
    assert len(cat["fields"]) == 1
    assert cat["fields"][0]["field_name"] == "jenis_kerusakan"
    assert cat["fields"][0]["is_required"] is True
