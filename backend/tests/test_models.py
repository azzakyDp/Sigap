"""
Unit tests untuk SQLAlchemy models dan Alembic setup SIGAP Backend.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import app.models as models
from app.core.database import Base


def test_models_import():
    """Memastikan seluruh model dan enum dapat di-import tanpa error."""
    expected_models = [
        "UserRole",
        "ReportStatus",
        "ReportPriority",
        "AIAnalysisStatus",
        "User",
        "ReportCategory",
        "CategoryField",
        "Report",
        "ReportFieldValue",
        "ReportEvidence",
        "ReportStatusHistory",
        "ReportAssignment",
        "ActionReport",
        "AIAnalysis",
    ]
    for model_name in expected_models:
        assert hasattr(models, model_name), f"Model/Enum {model_name} tidak ditemukan di app.models"


def test_models_metadata_tables():
    """Memastikan 10 tabel terdaftar di Base.metadata."""
    expected_tables = {
        "users",
        "report_categories",
        "category_fields",
        "reports",
        "report_field_values",
        "report_evidences",
        "report_status_histories",
        "report_assignments",
        "action_reports",
        "ai_analyses",
    }
    registered_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(registered_tables), f"Tabel missing: {expected_tables - registered_tables}"


def test_create_tables_sqlite_in_memory():
    """Memastikan Base.metadata.create_all dapat berjalan tanpa error pada SQLite in-memory."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        # Quick sanity test creating a category
        category = models.ReportCategory(
            nama_kategori="Jalan Rusak",
            default_priority=models.ReportPriority.HIGH,
            is_active=True,
        )
        session.add(category)
        session.commit()
        assert category.id is not None
