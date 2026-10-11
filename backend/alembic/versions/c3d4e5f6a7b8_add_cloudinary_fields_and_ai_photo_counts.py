"""add cloudinary fields and ai photo counts

Revision ID: c3d4e5f6a7b8
Revises: 0b1e07005fe5
Create Date: 2026-10-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = '0b1e07005fe5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Tambah kolom url, public_id, urutan ke report_evidences
    op.add_column('report_evidences', sa.Column('url', sa.String(length=1000), nullable=True))
    op.add_column('report_evidences', sa.Column('public_id', sa.String(length=255), nullable=True))
    op.add_column('report_evidences', sa.Column('urutan', sa.Integer(), server_default='0', nullable=False))

    # 2. Tambah kolom photos_analyzed dan photos_total ke ai_analyses
    op.add_column('ai_analyses', sa.Column('photos_analyzed', sa.Integer(), server_default='0', nullable=False))
    op.add_column('ai_analyses', sa.Column('photos_total', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    op.drop_column('ai_analyses', 'photos_total')
    op.drop_column('ai_analyses', 'photos_analyzed')
    op.drop_column('report_evidences', 'urutan')
    op.drop_column('report_evidences', 'public_id')
    op.drop_column('report_evidences', 'url')
