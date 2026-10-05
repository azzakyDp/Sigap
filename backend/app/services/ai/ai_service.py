"""
AIAnalysisService — Pintu masuk utama layanan analisis AI SIGAP Backend.

Satu-satunya pintu masuk ke AI dari luar modul services/ai/.
Route TIDAK boleh mengimpor provider.py secara langsung.
"""

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

import app.core.database as db_module
from app.core.config import settings
from app.core.exceptions import NotFoundException

from app.models.ai_analysis import AIAnalysis
from app.models.enums import AIAnalysisStatus, ReportPriority
from app.models.report import Report
from app.services.ai.provider import get_ai_provider
from app.services.ai.schemas import AIAnalysisResponse, AnalysisType


async def run_analysis_job(report_id: int, analysis_id: int) -> None:
    """
    Background job untuk memproses analisis AI.
    Membuka session DB baru dan menangani exception agar tidak meng-crash worker.
    """
    db: Session = db_module.SessionLocal()

    try:
        analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
        if not analysis:
            return

        analysis.status = AIAnalysisStatus.PROCESSING
        db.commit()

        try:
            report = db.query(Report).filter(Report.id == report_id).first()
            if not report:
                raise ValueError(f"Report ID {report_id} tidak ditemukan")

            provider = get_ai_provider()
            analysis_type = AnalysisType(analysis.analysis_type)
            result = await provider.analyze(report, analysis_type)

            analysis.model_name = result.model_name
            analysis.suggested_category = result.suggested_category
            analysis.suggested_priority = (
                ReportPriority(result.suggested_priority)
                if result.suggested_priority
                else None
            )
            analysis.confidence = result.confidence
            analysis.summary = result.summary
            analysis.evidence = result.evidence
            analysis.warnings = result.warnings
            analysis.needs_human_review = result.needs_human_review
            analysis.status = AIAnalysisStatus.COMPLETED
            db.commit()

        except Exception as exc:
            db.rollback()
            # Re-fetch analysis setelah rollback untuk update status FAILED
            analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
            if analysis:
                analysis.status = AIAnalysisStatus.FAILED
                analysis.warnings = [f"Gagal menghasilkan analisis: {str(exc)}"]
                db.commit()

    finally:
        db.close()


class AIAnalysisService:
    async def get_or_trigger_analysis(
        self,
        db: Session,
        report_id: int,
        background_tasks: BackgroundTasks,
    ) -> AIAnalysisResponse:
        """
        Mengambil hasil analisis AI terbaru yang COMPLETED, atau memicu analisis baru di background.
        """
        report = db.query(Report).filter(Report.id == report_id).with_for_update().first()
        if not report:
            raise NotFoundException(f"Laporan dengan ID {report_id} tidak ditemukan")


        # 1. Cek apakah ada hasil COMPLETED terbaru
        completed_analysis = (
            db.query(AIAnalysis)
            .filter(
                AIAnalysis.report_id == report_id,
                AIAnalysis.status == AIAnalysisStatus.COMPLETED,
            )
            .order_by(AIAnalysis.id.desc())
            .first()
        )
        if completed_analysis:
            return AIAnalysisResponse.model_validate(completed_analysis)

        # 2. Cek apakah ada proses PENDING / PROCESSING yang masih berjalan
        running_analysis = (
            db.query(AIAnalysis)
            .filter(
                AIAnalysis.report_id == report_id,
                AIAnalysis.status.in_([AIAnalysisStatus.PENDING, AIAnalysisStatus.PROCESSING]),
            )
            .order_by(AIAnalysis.id.desc())
            .first()
        )
        if running_analysis:
            return AIAnalysisResponse.model_validate(running_analysis)

        # 3. Cek apakah ada hasil FAILED sebelumnya (agar tidak loop pemicuan otomatis saat polling)
        failed_analysis = (
            db.query(AIAnalysis)
            .filter(
                AIAnalysis.report_id == report_id,
                AIAnalysis.status == AIAnalysisStatus.FAILED,
            )
            .order_by(AIAnalysis.id.desc())
            .first()
        )
        if failed_analysis:
            return AIAnalysisResponse.model_validate(failed_analysis)

        # 3. Jika belum ada, buat row PENDING baru
        model_name = settings.AI_MODEL or "gemini-3.1-flash-lite"
        new_analysis = AIAnalysis(
            report_id=report_id,
            model_name=model_name,
            analysis_type=AnalysisType.CATEGORY_PRIORITY_SUGGESTION.value,
            suggested_category=None,
            suggested_priority=None,
            confidence=0.0,
            summary="Analisis sedang diproses...",
            evidence=[],
            warnings=[],
            needs_human_review=True,
            status=AIAnalysisStatus.PENDING,
        )
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)

        background_tasks.add_task(run_analysis_job, report_id, new_analysis.id)

        return AIAnalysisResponse.model_validate(new_analysis)

    async def force_new_analysis(
        self,
        db: Session,
        report_id: int,
        background_tasks: BackgroundTasks,
    ) -> AIAnalysisResponse:
        """
        Paksa pembuatan analisis AI baru (re-analyze), mengabaikan cache COMPLETED.
        """
        report = db.query(Report).filter(Report.id == report_id).first()
        if not report:
            raise NotFoundException(f"Laporan dengan ID {report_id} tidak ditemukan")

        model_name = settings.AI_MODEL or "gemini-3.1-flash-lite"
        new_analysis = AIAnalysis(
            report_id=report_id,
            model_name=model_name,
            analysis_type=AnalysisType.CATEGORY_PRIORITY_SUGGESTION.value,
            suggested_category=None,
            suggested_priority=None,
            confidence=0.0,
            summary="Analisis sedang diproses...",
            evidence=[],
            warnings=[],
            needs_human_review=True,
            status=AIAnalysisStatus.PENDING,
        )
        db.add(new_analysis)
        db.commit()
        db.refresh(new_analysis)

        background_tasks.add_task(run_analysis_job, report_id, new_analysis.id)

        return AIAnalysisResponse.model_validate(new_analysis)
