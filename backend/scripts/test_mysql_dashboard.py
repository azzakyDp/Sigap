"""
Script Uji Dashboard & Agregasi SIGAP di MySQL (Real MySQL DB Test).

Menjalankan pengujian DashboardService (summary, trend harian, trend mingguan, needs-attention)
langsung di atas MySQL untuk membuktikan dialect detection dan SQL functions (DATE, DATE_FORMAT)
berjalan 100% sukses tanpa sintaks error.

Penggunaan:
    python scripts/test_mysql_dashboard.py
"""

import sys
from datetime import date, timedelta
from pathlib import Path

# Fix sys.path agar dapat di-import dari root folder backend
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import Base, SessionLocal
from app.services.dashboard_service import DashboardService
from scripts.seed_categories import seed as seed_categories
from scripts.seed_report_dataset import seed_dataset
from scripts.seed_staff_accounts import seed_staff as seed_staff_accounts


def run_mysql_dashboard_test():
    print("==================================================================")
    print("  SIGAP MySQL Dashboard & Aggregation Test (Real MySQL DB)")
    print("==================================================================")

    db = SessionLocal()
    try:
        # Ensure database tables exist in MySQL
        Base.metadata.create_all(bind=db.get_bind())
        dialect_name = db.bind.dialect.name
        print(f"[1] Terhubung ke MySQL Database (Dialect: {dialect_name})")

        # Ensure seed data exists in MySQL
        print("[2] Menyiapkan data master & seed dataset di MySQL...")
        seed_categories()
        seed_staff_accounts()
        seed_dataset(total_count=50, reset=False)

        # 1. Test GET /dashboard/summary
        print("\n[3] Uji DashboardService.get_summary() di MySQL...")
        summary = DashboardService.get_summary(db=db)
        print(f"    - Total Reports       : {summary.total_reports}")
        print(f"    - Needs Attention     : {summary.needs_attention_count}")
        print(f"    - By Status           : {summary.by_status}")
        print(f"    - By Priority         : {summary.by_priority}")

        # 2. Test GET /dashboard/trend (daily)
        print("\n[4] Uji DashboardService.get_trend(granularity='daily') di MySQL...")
        start_d = date.today() - timedelta(days=60)
        end_d = date.today()
        trend_daily = DashboardService.get_trend(
            db=db,
            granularity="daily",
            start_date=start_d,
            end_date=end_d,
        )
        print(f"    - Granularity         : {trend_daily.granularity}")
        print(f"    - Data Points Count   : {len(trend_daily.data)}")
        if trend_daily.data:
            print(f"    - Sample Points (5)   : {[f'{p.period}: {p.count}' for p in trend_daily.data[:5]]}")

        # 3. Test GET /dashboard/trend (weekly)
        print("\n[5] Uji DashboardService.get_trend(granularity='weekly') di MySQL...")
        trend_weekly = DashboardService.get_trend(
            db=db,
            granularity="weekly",
            start_date=start_d,
            end_date=end_d,
        )
        print(f"    - Granularity         : {trend_weekly.granularity}")
        print(f"    - Data Points Count   : {len(trend_weekly.data)}")
        if trend_weekly.data:
            print(f"    - Sample Points (5)   : {[f'{p.period}: {p.count}' for p in trend_weekly.data[:5]]}")

        # 4. Test GET /dashboard/needs-attention
        print("\n[6] Uji DashboardService.get_needs_attention() di MySQL...")
        needs_att = DashboardService.get_needs_attention(db=db, page=1, page_size=5)
        print(f"    - Total Items         : {needs_att.total}")
        print(f"    - Total Pages         : {needs_att.total_pages}")
        if needs_att.items:
            print(f"    - Sample Item Reason  : ID #{needs_att.items[0].id} -> Reason: {needs_att.items[0].attention_reason}")

        print("\n==================================================================")
        print("  HASIL: SUKSES 100%! Semua query dashboard berjalan di MySQL asli!")
        print("==================================================================")

    except Exception as e:
        print(f"\n[ERROR] MySQL Dashboard Test GAGAL: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    run_mysql_dashboard_test()
