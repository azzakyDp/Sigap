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
from urllib.parse import urlparse

from google import genai
from google.genai import types
import httpx

import app.core.database as db_module
from app.core.config import settings
from app.core.exceptions import ConfigurationError
from app.models.enums import ReportPriority
from app.models.report import Report
from app.models.report_category import ReportCategory
from app.services.ai.prompts import SYSTEM_INSTRUCTION, build_category_priority_prompt
from app.services.ai.schemas import AIAnalysisResult, AnalysisType
from app.services.storage.cloudinary_service import CloudinaryService
from app.services.storage_service import StorageService

logger = logging.getLogger("sigap.ai_provider")


def is_safe_cloudinary_url(url: str, cloud_name: str | None) -> bool:
    """Validasi anti-SSRF: hanya izinkan host res.cloudinary.com dan path yang memuat cloud_name."""
    if not url or not isinstance(url, str):
        return False
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    if parsed.netloc.lower() != "res.cloudinary.com":
        return False
    if cloud_name and cloud_name not in parsed.path:
        return False
    return True


async def download_photo_part(
    sem: asyncio.Semaphore,
    client: httpx.AsyncClient,
    ev: Any,
    cloud_name: str | None,
) -> tuple[types.Part | None, str | None]:
    """
    Mengunduh foto dari Cloudinary dengan anti-SSRF, timeout, dan batas ukuran respons.
    Mengembalikan tuple: (part_atau_none, pesan_error_atau_none).
    """
    raw_url = getattr(ev, "url", None) or getattr(ev, "display_url", None)
    public_id = getattr(ev, "public_id", None) or getattr(ev, "file_path", "unknown")

    # 1. URL HTTP / Cloudinary
    if raw_url and (raw_url.startswith("http://") or raw_url.startswith("https://")):
        if not is_safe_cloudinary_url(raw_url, cloud_name):
            logger.warning(
                f"SSRF Protection: URL foto ditolak (public_id='{public_id}', bukan Cloudinary terverifikasi)"
            )
            return None, f"URL foto ditolak oleh anti-SSRF (public_id='{public_id}')"

        ai_url = CloudinaryService.build_ai_url(raw_url, max_width=1024)
        async with sem:
            try:
                resp = await client.get(ai_url, timeout=12.0)
                if resp.status_code != 200 and ai_url != raw_url:
                    logger.info(
                        f"Transformasi AI URL mengembalikan HTTP {resp.status_code}, mencoba mengunduh URL asli (raw_url) untuk public_id='{public_id}'"
                    )
                    resp = await client.get(raw_url, timeout=12.0)

                if resp.status_code != 200:
                    logger.warning(f"Gagal unduh foto bukti public_id='{public_id}': HTTP {resp.status_code}")
                    return None, f"HTTP {resp.status_code} saat mengunduh foto (public_id='{public_id}')"

                content = resp.content
                if len(content) > 10 * 1024 * 1024:
                    logger.warning(f"Foto bukti public_id='{public_id}' melebihi batas 10MB ({len(content)} bytes)")
                    return None, f"Ukuran foto melebihi batas 10MB (public_id='{public_id}')"

                mime_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip().lower()
                if mime_type not in ("image/jpeg", "image/png", "image/webp"):
                    mime_type = "image/jpeg"

                part = types.Part.from_bytes(data=content, mime_type=mime_type)
                return part, None
            except Exception as exc:
                logger.warning(f"Exception saat unduh foto bukti public_id='{public_id}': {exc}")
                return None, f"Gagal mengunduh foto (public_id='{public_id}'): {exc}"

    # 2. Fallback untuk data lama (lokal disk)
    storage_service = StorageService()
    try:
        local_path = storage_service.resolve_local_path(getattr(ev, "file_path", ""))
        if local_path.exists() and local_path.is_file():
            image_bytes = local_path.read_bytes()
            mime_type = getattr(ev, "mime_type", None) or "image/jpeg"
            return types.Part.from_bytes(data=image_bytes, mime_type=mime_type), None
        else:
            logger.warning(f"Foto bukti lokal tidak ditemukan di disk: public_id='{public_id}'")
            return None, f"Foto lokal tidak ditemukan (public_id='{public_id}')"
    except Exception as exc:
        logger.warning(f"Gagal memuat foto lokal public_id='{public_id}': {exc}")
        return None, f"Gagal memuat foto lokal (public_id='{public_id}'): {exc}"


def should_trigger_fallback(err: Exception) -> bool:
    """
    Pemicu fallback: 404, 429, 503, dan timeout.
    Jangan fallback untuk 400 dan 403.
    """
    err_str = str(err).lower()
    # Jangan fallback untuk 400 (Bad Request) dan 403 (Forbidden)
    if "400" in err_str or "bad_request" in err_str or "invalid_argument" in err_str:
        return False
    if "403" in err_str or "permission_denied" in err_str or "forbidden" in err_str:
        return False

    return (
        "404" in err_str
        or "not_found" in err_str
        or "no longer available" in err_str
        or "is not found" in err_str
        or "429" in err_str
        or "resource_exhausted" in err_str
        or "rate_limit" in err_str
        or "quota" in err_str
        or "503" in err_str
        or "unavailable" in err_str
        or "timeout" in err_str
    )


class AIProvider(ABC):
    """Interface abstrak untuk provider AI."""

    @abstractmethod
    async def analyze(self, report: Report, analysis_type: AnalysisType) -> AIAnalysisResult:
        """
        Menganalisis laporan (teks + gambar jika tersedia) dan
        mengembalikan rekomendasi terstruktur (AIAnalysisResult).
        """
        pass

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        """
        Smoke test sederhana untuk mengecek koneksi ke model Gemini dengan prompt teks pendek.
        """
        pass


class GeminiProvider(AIProvider):
    """
    Implementasi konkret GeminiProvider menggunakan SDK resmi google-genai.
    Model, API Key, Fallback Model, dan Timeout dibaca dari settings (.env).
    """

    async def _generate_content_with_fallback(
        self,
        client: genai.Client,
        contents: list[Any],
        config: types.GenerateContentConfig | None,
        timeout_secs: float,
        context_desc: str = "",
    ) -> tuple[Any, str]:
        """
        Memanggil client.aio.models.generate_content dengan model utama (AI_MODEL).
        Pemicu fallback: 404, 429, 503, dan timeout. Jangan fallback untuk 400 dan 403.
        """
        primary_model = settings.AI_MODEL or "gemini-3.1-flash-lite"
        fallback_model = settings.AI_MODEL_FALLBACK or "gemini-2.5-flash"

        models_to_try = [primary_model]
        if fallback_model and fallback_model != primary_model:
            models_to_try.append(fallback_model)

        last_err: Exception | None = None
        for idx, model_name in enumerate(models_to_try):
            try:
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=config,
                    ),
                    timeout=timeout_secs,
                )
                if idx > 0:
                    logger.warning(
                        f"GEMINI FALLBACK SUKSES pada {context_desc}: Berhasil menggunakan model '{model_name}'"
                    )
                return response, model_name

            except asyncio.TimeoutError as t_err:
                last_err = t_err
                if idx < len(models_to_try) - 1:
                    next_model = models_to_try[idx + 1]
                    logger.warning(
                        f"GEMINI FALLBACK TRIGGERED pada {context_desc}: Timeout ({timeout_secs}s) pada model '{model_name}'. "
                        f"Mencoba beralih ke fallback model '{next_model}'..."
                    )
                    continue

                logger.exception(
                    f"GEMINI ERROR: Timeout ({timeout_secs}s) pada {context_desc} (model={model_name})"
                )
                raise TimeoutError(f"Pemanggilan Gemini API mengalami timeout ({timeout_secs}s)") from t_err

            except Exception as err:
                last_err = err
                if should_trigger_fallback(err) and idx < len(models_to_try) - 1:
                    next_model = models_to_try[idx + 1]
                    logger.warning(
                        f"GEMINI FALLBACK TRIGGERED pada {context_desc}: Model '{model_name}' error ({err}). "
                        f"Mencoba beralih ke fallback model '{next_model}'..."
                    )
                    continue

                err_msg = str(err).replace(settings.AI_API_KEY or "", "***")
                logger.exception(
                    f"GEMINI ERROR: Gagal memanggil Gemini API pada {context_desc} (model={model_name}): {repr(err)}"
                )
                raise RuntimeError(f"Gagal memanggil Gemini API: {err_msg}") from err

        if last_err:
            raise last_err
        raise RuntimeError("Gagal menghasilkan respon dari Gemini API")

    async def health_check(self) -> dict[str, Any]:
        if not settings.AI_API_KEY:
            logger.error("GEMINI ERROR: AI_API_KEY belum dikonfigurasi di environment / .env")
            raise ConfigurationError("AI_API_KEY belum dikonfigurasi di environment / .env")

        timeout_secs = float(settings.AI_TIMEOUT or 30)
        client = genai.Client(api_key=settings.AI_API_KEY)

        response, used_model = await self._generate_content_with_fallback(
            client=client,
            contents=["Halo, ini adalah tes koneksi AI SIGAP. Balas dengan singkat OK."],
            config=None,
            timeout_secs=timeout_secs,
            context_desc="AI Health Check",
        )

        response_text = getattr(response, "text", None) or ""
        return {
            "status": "ok",
            "provider": "gemini",
            "model": used_model,
            "response": response_text.strip(),
            "fallback_used": (used_model != (settings.AI_MODEL or "gemini-3.1-flash-lite")),
        }

    async def analyze(self, report: Report, analysis_type: AnalysisType) -> AIAnalysisResult:
        if not settings.AI_API_KEY:
            logger.error("GEMINI ERROR: AI_API_KEY belum dikonfigurasi di environment / .env")
            raise ConfigurationError("AI_API_KEY belum dikonfigurasi di environment / .env")

        start_time = time.time()
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

        # 3. Kumpulkan bagian request (Prompt Teks + Maksimal 3 Foto Bukti dari Cloudinary/Lokal)
        contents: list[Any] = [prompt_text]

        raw_evidences = getattr(report, "evidences", []) or []
        photos_total = len(raw_evidences)
        photos_analyzed = 0
        photo_warnings: list[str] = []

        # Ambil maksimal 3 foto untuk analisis multimodal
        evidences_to_process = raw_evidences[:3]
        if evidences_to_process:
            sem = asyncio.Semaphore(3)
            async with httpx.AsyncClient() as http_client:
                download_tasks = [
                    download_photo_part(
                        sem=sem,
                        client=http_client,
                        ev=ev,
                        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    )
                    for ev in evidences_to_process
                ]
                results = await asyncio.gather(*download_tasks, return_exceptions=True)

            for res in results:
                if isinstance(res, tuple):
                    part, err_msg = res
                    if part is not None:
                        contents.append(part)
                        photos_analyzed += 1
                    elif err_msg:
                        photo_warnings.append(err_msg)
                elif isinstance(res, Exception):
                    logger.warning(f"Error tidak terduga saat unduh foto: {res}")
                    photo_warnings.append(f"Gagal memuat foto: {str(res)}")

        logger.info(
            f"Panggilan Gemini API dimulai: target_model={settings.AI_MODEL}, report_id={report.id}, "
            f"total_parts={len(contents)}, photos_analyzed={photos_analyzed}/{photos_total}"
        )

        # 4. Panggil Gemini API via google-genai SDK (dengan auto-fallback ke AI_MODEL_FALLBACK)
        client = genai.Client(api_key=settings.AI_API_KEY)
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            response_mime_type="application/json",
            temperature=0.2,
        )

        response, used_model = await self._generate_content_with_fallback(
            client=client,
            contents=contents,
            config=config,
            timeout_secs=timeout_secs,
            context_desc=f"Report #{report.id}",
        )

        # 5. Parse dan Validasi Respons JSON
        response_text = getattr(response, "text", None) or ""
        if not response_text.strip():
            logger.error(f"GEMINI ERROR: Response dari Gemini API kosong untuk Report #{report.id}")
            raise ValueError("Response dari Gemini API kosong")

        try:
            data = json.loads(response_text)
        except json.JSONDecodeError as json_err:
            logger.exception(f"GEMINI ERROR: Response Gemini bukan JSON valid untuk Report #{report.id}: {response_text[:200]}")
            raise ValueError(f"Response dari Gemini API bukan JSON valid: {json_err}")

        # Validasi Rekomendasi Kategori
        valid_category_names = {c.nama_kategori for c in categories}
        suggested_category = data.get("suggested_category")
        if suggested_category is not None and suggested_category not in valid_category_names:
            logger.error(f"GEMINI ERROR: Kategori '{suggested_category}' tidak terdaftar di DB untuk Report #{report.id}")
            raise ValueError(
                f"Gemini mengembalikan kategori '{suggested_category}' yang tidak terdaftar di DB"
            )

        # Validasi Rekomendasi Prioritas
        valid_priorities = {p.value for p in ReportPriority}
        suggested_priority = data.get("suggested_priority")
        if suggested_priority is not None and suggested_priority not in valid_priorities:
            logger.error(f"GEMINI ERROR: Prioritas '{suggested_priority}' tidak valid untuk Report #{report.id}")
            raise ValueError(
                f"Gemini mengembalikan prioritas '{suggested_priority}' yang tidak valid"
            )

        summary_text = data.get("summary", "Analisis Gemini selesai.")
        warnings_list: list[str] = list(data.get("warnings", []))

        # Jika ada foto yang gagal diunduh, tambahkan catatan eksplisit pada ringkasan
        if photos_total > 0 and photos_analyzed < photos_total:
            note = f"[Catatan: {photos_total - photos_analyzed} dari {photos_total} foto tidak dapat dianalisis oleh AI]"
            if note not in summary_text:
                summary_text = f"{summary_text}\n\n{note}"
            warnings_list.append(f"Sebagian foto tidak dapat dianalisis ({photos_analyzed}/{photos_total} foto berhasil dimuat).")

        result = AIAnalysisResult(
            model_name=used_model,
            analysis_type=analysis_type,
            suggested_category=suggested_category,
            suggested_priority=suggested_priority,
            confidence=float(data.get("confidence", 0.0)),
            summary=summary_text,
            evidence=data.get("evidence", []),
            warnings=warnings_list,
            needs_human_review=bool(data.get("needs_human_review", True)),
            photos_analyzed=photos_analyzed,
            photos_total=photos_total,
        )

        duration = time.time() - start_time
        logger.info(
            f"Gemini API SUKSES untuk Report #{report.id} dalam {duration:.2f}s (model={used_model}). "
            f"Priority: {result.suggested_priority}, Category: {result.suggested_category}, "
            f"photos={photos_analyzed}/{photos_total}"
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


