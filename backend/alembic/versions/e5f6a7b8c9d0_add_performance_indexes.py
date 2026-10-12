"""add performance indexes

Revision ID: e5f6a7b8c9d0
Revises: c3d4e5f6a7b8
Create Date: 2026-10-12 21:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Reports: komposit antrean (status, created_at) dan riwayat user (citizen_id, created_at)
    # Catatan: ix_reports_status sengaja tidak dibuat karena sudah ter-cover oleh leading column ix_reports_status_created_at
    op.create_index('ix_reports_status_created_at', 'reports', ['status', 'created_at'], unique=False)
    op.create_index('ix_reports_citizen_created_at', 'reports', ['citizen_id', 'created_at'], unique=False)
    op.create_index('ix_reports_created_at', 'reports', ['created_at'], unique=False)

    # 2. AI Analyses: lookup status analisis per laporan
    op.create_index('ix_ai_analyses_report_id_status', 'ai_analyses', ['report_id', 'status'], unique=False)

    # 3. Report Assignments: lookup penugasan aktif (is_current=True)
    op.create_index('ix_report_assignments_report_id_is_current', 'report_assignments', ['report_id', 'is_current'], unique=False)
    op.create_index('ix_report_assignments_officer_id_is_current', 'report_assignments', ['officer_id', 'is_current'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_report_assignments_officer_id_is_current', table_name='report_assignments')
    op.drop_index('ix_report_assignments_report_id_is_current', table_name='report_assignments')
    op.drop_index('ix_ai_analyses_report_id_status', table_name='ai_analyses')
    op.drop_index('ix_reports_created_at', table_name='reports')
    op.drop_index('ix_reports_citizen_created_at', table_name='reports')
    op.drop_index('ix_reports_status_created_at', table_name='reports')
