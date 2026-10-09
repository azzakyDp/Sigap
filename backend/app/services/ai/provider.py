"""
AI Provider Adapter — Phase 7 Integrasi Gemini API Sungguhan.

FastAPI -> AIAnalysisService -> GeminiProvider -> Google Gemini API (via google-genai SDK)
"""

from abc import ABC, abstractmethod
import asyncio
import json
import logging
from pathlib import Path
import time
from typing import Any

from google import genai
from google.genai import types

import app.core.database as db_module
from app.core.config import settings
from app.core.exceptions import ConfigurationError
from app.models.enums import ReportPriority
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.services.ai.prompts import SYSTEM_INSTRUCTION, build_category_priority_prompt
from app.services.ai.schemas import AIAnalysisResult, AnalysisType
from app.services.storage_service import StorageService

logger = logging.getLogger("sigap.ai_provider")


class AIProvider(ABC):
    """Interface abstrak untuk provider AI."""

    @abstractmethod
    async def analyze(self, report: Report, analysis_type: AnalysisType) -> AIAnalysisResult:
        """
        Menganalisis laporan (teks + gambar jika tersedia) dan
        mengembalikan rekomendasi terstruktur (AIAnalysisResult).
        """
        pass


class GeminiProvider(AIProvider):
    """
    Implementasi konkret GeminiProvider menggunakan SDK resmi google-genai.
    Model, API Key, dan Timeout dibaca dari settings (.env).
    """

    async def analyze(self, report: Report, analysis_type: AnalysisType) -> AIAnalysisResult:
        if not settings.AI_API_KEY:
            raise ConfigurationError("AI_API_KEY belum dikonfigurasi di environment / .env")

        start_time = time.time()
        model_name = settings.AI_MODEL or "gemini-2.0-flash-lite"
        timeout_secs = float(settings.AI_TIMEOUT or 30)

        # 1. Ambil daftar kategori aktif dari database
        db = db_module.SessionLocal()
        try:
            categories = db.query(ReportCategory).filter(ReportCategory.is_active.is_(True)).all()
        finally:
            db.close()

        # 2. Bangun Prompt
        if analysis_type == AnalysisType.CATEGORY_PRIORITY_SUGGESTION:
            prompt_text = build_category_priority_prompt(report, categories)
        else:
            raise ValueError(f"AnalysisType '{analysis_type}' belum didukung")

        # 3. Kumpulkan bagian request (Prompt Teks + Maksimal 3 Foto Bukti)
        contents: list[Any] = [prompt_text]

        storage_service = StorageService()
        if hasattr(report, "evidences") and report.evidences:
            for ev in report.evidences[:3]:
                try:
                    local_path = storage_service.resolve_local_path(ev.file_path)
                    if local_path.exists() and local_path.is_file():
                        image_bytes = local_path.read_bytes()
                        mime_type = getattr(ev, "mime_type", None) or "image/jpeg"
                        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                        contents.append(part)
                except Exception as file_err:
                    logger.warning(f"Gagal memuat foto bukti '{ev.file_path}' untuk AI: {file_err}")

        logger.info(
            f"Panggilan Gemini API dimulai: model={model_name}, report_id={report.id}, total_parts={len(contents)}"
        )

        # 4. Panggil Gemini API via google-genai SDK
        client = genai.Client(api_key=settings.AI_API_KEY)
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            temperature=0.2,
        )

        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                ),
                timeout=timeout_secs,
            )

        except asyncio.TimeoutError:
            duration = time.time() - start_time
            logger.error(f"Gemini API Timeout ({timeout_secs}s) untuk Report #{report.id} setelah {duration:.2f}s")
            raise TimeoutError(f"Pemanggilan Gemini API mengalami timeout ({timeout_secs}s)")
        except Exception as err:
            duration = time.time() - start_time
            err_msg = str(err).replace(settings.AI_API_KEY or "", "***")
            logger.error(f"Gemini API Error untuk Report #{report.id} setelah {duration:.2f}s: {err_msg}")
            raise RuntimeError(f"Gagal memanggil Gemini API: {err_msg}")

        # 5. Parse dan Validasi Respons JSON
        response_text = getattr(response, "text", None) or ""
        if not response_text.strip():
            raise ValueError("Response dari Gemini API kosong")

        try:
            data = json.loads(response_text)
        except json.JSONDecodeError as json_err:
            logger.error(f"Response Gemini bukan JSON valid: {response_text[:200]}")
            raise ValueError(f"Response dari Gemini API bukan JSON valid: {json_err}")

        # Validasi Rekomendasi Kategori
        valid_category_names = {c.nama_kategori for c in categories}
        suggested_category = data.get("suggested_category")
        if suggested_category is not None and suggested_category not in valid_category_names:
            raise ValueError(
                f"Gemini mengembalikan kategori '{suggested_category}' yang tidak terdaftar di DB"
            )

        # Validasi Rekomendasi Prioritas
        valid_priorities = {p.value for p in ReportPriority}
        suggested_priority = data.get("suggested_priority")
        if suggested_priority is not None and suggested_priority not in valid_priorities:
            raise ValueError(
                f"Gemini mengembalikan prioritas '{suggested_priority}' yang tidak valid"
            )

        result = AIAnalysisResult(
            model_name=model_name,
            analysis_type=analysis_type,
            suggested_category=suggested_category,
            suggested_priority=suggested_priority,
            confidence=float(data.get("confidence", 0.0)),
            summary=data.get("summary", "Analisis Gemini selesai."),
            evidence=data.get("evidence", []),
            warnings=data.get("warnings", []),
            needs_human_review=bool(data.get("needs_human_review", True)),
        )

        duration = time.time() - start_time
        logger.info(
            f"Gemini API SUKSES untuk Report #{report.id} dalam {duration:.2f}s. "
            f"Priority: {result.suggested_priority}, Category: {result.suggested_category}"
        )

        return result


def get_ai_provider() -> AIProvider:
    """
    Factory function untuk mendapatkan instance AIProvider sesuai settings.AI_PROVIDER.
    """
    provider_name = (settings.AI_PROVIDER or "").lower()
    if provider_name == "gemini":
        return GeminiProvider()
    raise ConfigurationError(f"AI Provider '{settings.AI_PROVIDER}' tidak dikenal atau belum dikonfigurasi.")
