"""
Koneksi database SQLAlchemy untuk SIGAP Backend.

Phase 1: hanya menyiapkan engine, session factory, dan declarative Base.
Model (Phase 2) akan mewarisi `Base` ini. Migration dikelola oleh Alembic,
BUKAN oleh `Base.metadata.create_all()` di production.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

connect_args = {}
if settings.DB_SSL_CA_PATH and settings.DATABASE_URL.startswith("mysql"):
    connect_args["ssl"] = {"ca": settings.DB_SSL_CA_PATH}


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    connect_args=connect_args,
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

# connect_args = {}
# if settings.DB_SSL_CA_PATH:
#     connect_args["ssl"] = {"ca": settings.DB_SSL_CA_PATH}

# engine = create_engine(
#     settings.DATABASE_URL,
#     pool_pre_ping=True,
#     echo=settings.DEBUG,
#     connect_args=connect_args,
# )