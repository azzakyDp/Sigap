"""
Koneksi database SQLAlchemy untuk SIGAP Backend.

Phase 1: hanya menyiapkan engine, session factory, dan declarative Base.
Model (Phase 2) akan mewarisi `Base` ini. Migration dikelola oleh Alembic,
BUKAN oleh `Base.metadata.create_all()` di production.
"""

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

connect_args = {}
if settings.DB_SSL_CA_PATH and os.path.exists(settings.DB_SSL_CA_PATH) and settings.DATABASE_URL.startswith("mysql"):
    connect_args["ssl"] = {"ca": settings.DB_SSL_CA_PATH}


engine_kwargs: dict = {
    "pool_pre_ping": True,
    "pool_recycle": 1800,
    "echo": settings.DEBUG,
    "connect_args": connect_args,
}
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 5,
    })

engine = create_engine(
    settings.DATABASE_URL,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



class Base(DeclarativeBase):
    """Base class untuk seluruh SQLAlchemy model (didefinisikan mulai Phase 2)."""

    pass


def get_db() -> Generator:
    """
    FastAPI dependency untuk mendapatkan session database per-request.
    Digunakan di route/repository mulai Phase 2+.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()