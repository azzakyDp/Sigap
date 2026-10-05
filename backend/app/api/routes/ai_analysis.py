"""
Router Endpoint AI Analysis (Get & Force Re-analyze).
"""

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.core.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.services.ai.ai_service import AIAnalysisService
from app.services.ai.schemas import AIAnalysisResponse

router = APIRouter(prefix="/reports", tags=["AI Analysis"])
ai_service = AIAnalysisService()


@router.get(
    "/{id}/ai-analysis",
    response_model=AIAnalysisResponse,
    summary="Mendapatkan atau memicu analisis AI per laporan",
)
async def get_ai_analysis(
    id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> AIAnalysisResponse:
    return await ai_service.get_or_trigger_analysis(
        db=db,
        report_id=id,
        background_tasks=background_tasks,
    )


@router.post(
    "/{id}/ai-analysis/reanalyze",
    response_model=AIAnalysisResponse,
    summary="Memicu analisis AI baru untuk laporan",
)
async def reanalyze_report(
    id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(UserRole.VERIFIER, UserRole.ADMIN)),
    db: Session = Depends(get_db),
) -> AIAnalysisResponse:
    return await ai_service.force_new_analysis(
        db=db,
        report_id=id,
        background_tasks=background_tasks,
    )
