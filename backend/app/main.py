"""
SIGAP Backend — Entry point FastAPI.

Phase 1: hanya application foundation.
Belum ada business logic, auth, atau router domain (menyusul Phase 3+).
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    ai_analysis_router,
    auth_router,
    categories_router,
    dashboard_router,
    reports_router,
    uploads_router,
)
from app.core.config import settings
from app.core.exceptions import SigapException

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend REST API untuk SIGAP — Sistem Informasi Pengaduan Gangguan Lalu Lintas.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
app.include_router(ai_analysis_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")


@app.exception_handler(SigapException)
def sigap_exception_handler(request: Request, exc: SigapException) -> JSONResponse:
    """
    Handler generik untuk seluruh SigapException agar client tidak pernah
    menerima stack trace internal (sesuai bagian 30 Master Prompt — Security).
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.get("/", tags=["health"])
def root() -> dict:
    return {
        "service": settings.APP_NAME,
        "status": "ok",
    }


@app.get("/api/v1/health", tags=["health"])
def health_check() -> dict:
    """
    Smoke-test endpoint untuk Phase 1.
    Nantinya bisa dikembangkan untuk cek koneksi database, dsb.
    """
    return {"status": "healthy"}
