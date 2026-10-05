"""
Script seed data master kategori pengaduan dan field dinamis (PRD SIGAP).

Menjalankan script ini akan mengisi database dengan master kategori & field dinamis.
Penggunaan:
    python scripts/seed_categories.py
"""

import os
import sys
from pathlib import Path

# Fix sys.path agar dapat di-import dari root folder backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.category_field import CategoryField
from app.models.enums import ReportPriority
from app.models.report_category import ReportCategory

CATEGORIES_DATA = [
    {
        "nama_kategori": "Jalan Rusak / Berlubang",
        "default_priority": ReportPriority.HIGH,
        "is_active": True,
        "fields": [
            {"field_name": "jenis_kerusakan", "field_type": "select", "is_required": True},
            {"field_name": "kedalaman_lubang_cm", "field_type": "number", "is_required": False},
            {"field_name": "perkiraan_panjang_m", "field_type": "number", "is_required": False},
        ],
    },
    {
        "nama_kategori": "Lampu Lalu Lintas Padam / Rusak",
        "default_priority": ReportPriority.URGENT,
        "is_active": True,
        "fields": [
            {"field_name": "status_lampu", "field_type": "select", "is_required": True},
            {"field_name": "arah_persimpangan", "field_type": "text", "is_required": True},
        ],
    },
    {
        "nama_kategori": "Rambu Lalu Lintas Rusak / Tertutup",
        "default_priority": ReportPriority.MEDIUM,
        "is_active": True,
        "fields": [
            {"field_name": "jenis_rambu", "field_type": "text", "is_required": True},
            {"field_name": "kondisi_rambu", "field_type": "select", "is_required": True},
        ],
    },
    {
        "nama_kategori": "Pohon Tumbang / Penghalang Jalan",
        "default_priority": ReportPriority.URGENT,
        "is_active": True,
        "fields": [
            {"field_name": "dampak_kemacetan", "field_type": "select", "is_required": True},
            {"field_name": "butuh_alat_berat", "field_type": "boolean", "is_required": True},
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        import app.models  # Register all SQLAlchemy models
        from app.core.database import Base
        Base.metadata.create_all(bind=db.get_bind())

        print("Seeding master categories and dynamic fields...")

        count_added = 0

        for cat_data in CATEGORIES_DATA:
            stmt = select(ReportCategory).where(ReportCategory.nama_kategori == cat_data["nama_kategori"])
            existing = db.scalar(stmt)

            if not existing:
                category = ReportCategory(
                    nama_kategori=cat_data["nama_kategori"],
                    default_priority=cat_data["default_priority"],
                    is_active=cat_data["is_active"],
                )
                db.add(category)
                db.flush()

                for f_data in cat_data["fields"]:
                    field = CategoryField(
                        category_id=category.id,
                        field_name=f_data["field_name"],
                        field_type=f_data["field_type"],
                        is_required=f_data["is_required"],
                    )
                    db.add(field)

                count_added += 1
                print(f"  + Added Category: {category.nama_kategori}")
            else:
                print(f"  = Category already exists: {existing.nama_kategori}")

        db.commit()
        print(f"SUCCESS: Seeding finished successfully! ({count_added} categories added)")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Seeding error: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
