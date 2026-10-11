"""
Script pengujian manual koneksi Gemini API dan endpoint Health Check.
Jalankan dari direktori backend:
    python scripts/test_gemini_manual.py
"""

import asyncio
import logging
import sys
from pathlib import Path

# Setup Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_gemini_manual")


async def main():
    logger.info("=== TES KONEKSI GEMINI API ===")
    from app.core.config import settings
    from app.services.ai.provider import get_ai_provider

    logger.info(f"AI_PROVIDER: {settings.AI_PROVIDER}")
    logger.info(f"AI_MODEL: {settings.AI_MODEL}")
    logger.info(f"AI_API_KEY terkonfigurasi: {'Ya' if settings.AI_API_KEY else 'TIDAK (KOSONG!)'}")

    try:
        provider = get_ai_provider()
        logger.info("Memanggil Gemini Provider health_check()...")
        res = await provider.health_check()
        logger.info("✅ SUKSES KONEKSI GEMINI!")
        logger.info(f"Hasil: {res}")
    except Exception as e:
        logger.exception("❌ GEMINI ERROR: %s", repr(e))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
