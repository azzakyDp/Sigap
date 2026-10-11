from fastapi import FastAPI, HTTPException, Request
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
from app.services.ai.ai_service import AIAnalysisService

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend REST API untuk SIGAP — Sistem Informasi Pengaduan Gangguan Lalu Lintas.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(ai_analysis_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(uploads_router, prefix="/api/v1")
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
    """
    return {"status": "healthy"}


@app.get("/api/ai/health", tags=["health"])
@app.get("/api/v1/ai/health", tags=["health"])
async def ai_health_check() -> dict:
    """
    Smoke-test endpoint koneksi Gemini AI (tanpa data laporan / foto).
    """
    ai_service = AIAnalysisService()
    try:
        return await ai_service.health_check()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gemini AI Health Check Gagal: {str(exc)}")

