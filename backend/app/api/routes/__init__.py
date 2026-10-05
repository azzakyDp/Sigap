"""
Package routes SIGAP Backend.
"""

from app.api.routes.ai_analysis import router as ai_analysis_router
from app.api.routes.auth import router as auth_router
from app.api.routes.categories import router as categories_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.reports import router as reports_router
from app.api.routes.uploads import router as uploads_router

__all__ = [
    "ai_analysis_router",
    "auth_router",
    "categories_router",
    "dashboard_router",
    "reports_router",
    "uploads_router",
]

