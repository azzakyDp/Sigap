"""
Script untuk sinkronisasi 65 laporan kasus riil dari dataset_cases.json ke sistem SIGAP.
Menggantikan 65 data dummy lama dengan data kasus nyata (deskripsi detail, koordinat Lamongan, foto bukti).
"""

import json
import os
import sys
from pathlib import Path
import requests

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_PATH = BASE_DIR / "evidences" / "sigap_testing_dataset_500" / "dataset_cases.json"
API_BASE_URL = os.environ.get("SIGAP_API_URL", "https://sigap-69n9.onrender.com/api/v1")

# Koleksi URL foto representatif di Cloudinary sesuai kategori kerusakan
CATEGORY_EVIDENCE_URLS = {
    "Jalan Berlubang": [
        "https://res.cloudinary.com/sigap/image/upload/v1794984608/sigap_storage/fidpekvk7jlnszcypoyj.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984609/sigap_storage/oqk2mvi7yuxi9oj8ineg.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984609/sigap_storage/jljz8zzgabxsfi9zridd.jpg",
    ],
    "Jembatan Rusak": [
        "https://res.cloudinary.com/sigap/image/upload/v1794984566/sigap_storage/l9efq2bb3xi5vcqhkffb.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984566/sigap_storage/a5gopg4tylqml807hljq.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984566/sigap_storage/xldj7hl1rdixvqyv1rih.jpg",
    ],
    "Lampu Lalu Lintas Rusak": [
        "https://res.cloudinary.com/sigap/image/upload/v1794984584/sigap_storage/riimtxb6yajgcqhepoqt.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984585/sigap_storage/fm1qdgdpskxpu9kcecxw.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984585/sigap_storage/ntmq7bzioxqjjeujjw0u.jpg",
    ],
    "Kerusuhan / Balap Liar": [
        "https://res.cloudinary.com/sigap/image/upload/v1794984596/sigap_storage/se5yjcatwo43ptogwdrn.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984597/sigap_storage/aprb3seij24xxaurtcam.jpg",
        "https://res.cloudinary.com/sigap/image/upload/v1794984597/sigap_storage/ajnxj1ht1ezkfqmf9ywk.jpg",
    ],
}


def prepare_65_cases(limit: int = 65) -> list[dict]:
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        all_cases = json.load(f)

    selected = all_cases[:limit]
    cases_payload = []

    for item in selected:
        form = item.get("form_input", {})
        cat_name = form.get("kategori_pengaduan", "Jalan Berlubang")

        # Map to category_id
        if "Lampu" in cat_name:
            category_id = 2
            priority = "URGENT"
            dyn = {
                "status_lampu": "Mati Total Semua Aspek",
                "arah_persimpangan": "Persimpangan Utama",
            }
        elif "Kerusuhan" in cat_name or "Balap" in cat_name:
            category_id = 4
            priority = "URGENT"
            dyn = {
                "dampak_kemacetan": "Total Tidak Bisa Lewat",
                "butuh_alat_berat": "false",
            }
        else:
            # Jalan Berlubang & Jembatan Rusak
            category_id = 1
            priority = "HIGH"
            dyn = {
                "jenis_kerusakan": "Jalan Berlubang / Rusak Parah",
                "kedalaman_lubang_cm": "25",
                "perkiraan_panjang_m": "3",
            }

        # Evidences
        urls = CATEGORY_EVIDENCE_URLS.get(cat_name, CATEGORY_EVIDENCE_URLS["Jalan Berlubang"])

        case_obj = {
            "case_id": item.get("case_id"),
            "category_id": category_id,
            "deskripsi": f"[{item.get('case_id')}] {form.get('deskripsi_kejadian')}",
            "latitude": float(form.get("latitude", -7.1189)),
            "longitude": float(form.get("longitude", 112.4150)),
            "alamat_lokasi": form.get("alamat_keterangan_lokasi_detail", "Kab. Lamongan"),
            "priority": priority,
            "dynamic_fields": dyn,
            "evidence_urls": urls,
        }
        cases_payload.append(case_obj)

    return cases_payload


def run():
    print(f"=== Sinkronisasi 65 Data Laporan Kasus Riil (Teroptimasi) ===")
    print(f"Target Backend API: {API_BASE_URL}")
    print(f"Membaca dataset dari: {DATASET_PATH}")
    cases = prepare_65_cases(65)
    print(f"Berhasil menyiapkan {len(cases)} kasus riil.")

    # 1. Login Admin dengan retry cold-start (Render Free Tier)
    print("\nMelakukan login sebagai Admin...")
    session = requests.Session()
    max_retries = 3
    login_res = None

    for attempt in range(1, max_retries + 1):
        try:
            print(f"  Percobaan {attempt}/{max_retries} menghubungi server...")
            login_res = session.post(
                f"{API_BASE_URL}/auth/login",
                json={"identifier": "admin1@sigap.test", "password": "Admin123!"},
                timeout=45,
            )
            if login_res.status_code == 200:
                break
        except requests.exceptions.RequestException as e:
            print(f"  Server sedang bangun (cold-start): {e}. Menunggu 5 detik...")
            import time
            time.sleep(5)

    if not login_res or login_res.status_code != 200:
        print(f"Gagal login admin: {login_res.status_code if login_res else 'No response'} - {login_res.text if login_res else ''}")
        return

    token = login_res.json()["access_token"]
    print("Login admin berhasil (Token diperoleh).")

    # 2. Panggil Endpoint Apply Real Dataset
    print("\nMengirim batch 65 kasus riil ke endpoint /reports/admin/apply-real-dataset...")
    try:
        res = session.post(
            f"{API_BASE_URL}/reports/admin/apply-real-dataset",
            json={"cases": cases},
            headers={"Authorization": f"Bearer {token}"},
            timeout=90,
        )

        if res.status_code == 200:
            res_data = res.json()
            print(f"\n[SUKSES] {res_data.get('message')}")
            print(f"Total laporan diperbarui: {res_data.get('updated_count')}")
        else:
            print(f"\n[INFO / STATUS] {res.status_code}: {res.text}")
            print("Catatan: Pastikan perubahan backend telah di-push ke GitHub dan dideploy di Render.")
    except Exception as e:
        print(f"\n[ERROR] Koneksi terputus: {e}")


if __name__ == "__main__":
    run()
