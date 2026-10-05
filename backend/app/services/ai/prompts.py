"""
Prompt Engineering Module for SIGAP AI Assistant.

Menyediakan fungsi pembangun prompt terstruktur per AnalysisType.
Seluruh prompt berbahasa Indonesia agar sesuai dengan konteks laporan pengaduan SIGAP.
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.report import Report
    from app.models.report_category import ReportCategory


SYSTEM_INSTRUCTION = """
Anda adalah AI Assistant SIGAP (Sistem Informasi Pengaduan Gangguan Lalu Lintas & Infrastruktur Jalan Kabupaten Lamongan).
Tugas Anda adalah memberikan rekomendasi kategori dan tingkat prioritas penanganan pengaduan secara terstruktur dan objektif.

PRINSIP UTAMA:
1. AI memberikan rekomendasi, manusia (Verifier/Petugas) memberikan keputusan final.
2. Rekomendasi kategori (`suggested_category`) HARUS dipilih HANYA dari daftar kategori valid yang disediakan. Jangan mengarang nama kategori baru.
3. Rekomendasi prioritas (`suggested_priority`) HARUS salah satu dari: LOW, MEDIUM, HIGH, URGENT.
4. `needs_human_review` HARUS diset `true` jika:
   - Deskripsi laporan terlalu singkat atau ambigu.
   - Foto bukti kurang jelas/buram/tidak relevan.
   - Nilai `confidence` analisis Anda kurang dari 0.7.
5. `summary` HARUS berupa ringkasan 1-2 kalimat Bahasa Indonesia yang padat dan jelas.
""".strip()


def build_category_priority_prompt(report: "Report", categories: list["ReportCategory"]) -> str:
    """
    Membangun prompt untuk analisis kategori dan prioritas laporan pengaduan.
    """
    valid_categories_str = "\n".join([f"- {c.nama_kategori}" for c in categories if c.is_active])
    
    current_category_name = (
        report.category.nama_kategori if getattr(report, "category", None) else "Tidak diketahui"
    )

    dynamic_fields_str = "Tidak ada"
    if hasattr(report, "field_values") and report.field_values:
        fields = []
        for fv in report.field_values:
            category_field = getattr(fv, "category_field", None)
            field_name = (
                category_field.field_name
                if category_field
                else f"Field #{getattr(fv, 'category_field_id', 'unknown')}"
            )
            fields.append(f"- {field_name}: {fv.value}")
        if fields:
            dynamic_fields_str = "\n".join(fields)

    prompt = f"""
INFORMASI LAPORAN PENGADUAN:
- Nomor Laporan: {report.nomor_laporan}
- Deskripsi Kejadian: {report.deskripsi}
- Alamat / Lokasi: {report.alamat_lokasi} (Lat: {report.latitude}, Long: {report.longitude})
- Kategori Pilihan Pelapor (konteks): {current_category_name}
- Detail Field Dinamis:
{dynamic_fields_str}

DAFTAR KATEGORI VALID YANG TERSEDIA DI SYSTEM:
{valid_categories_str}

PETUNJUK OUTPUT:
Kelurkan analisis dalam format JSON terstruktur dengan skema berikut:
{{
  "suggested_category": "<salah satu dari daftar kategori valid di atas, atau null>",
  "suggested_priority": "<LOW | MEDIUM | HIGH | URGENT>",
  "confidence": <float 0.0 s/d 1.0>,
  "summary": "<1-2 kalimat ringkasan analisis dalam Bahasa Indonesia>",
  "evidence": ["<poin pendukung 1>", "<poin pendukung 2>"],
  "warnings": ["<catatan/peringatan jika ada, misal foto buram / deskripsi singkat>"],
  "needs_human_review": <true | false>
}}
""".strip()

    return prompt
