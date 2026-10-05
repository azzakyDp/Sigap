"""make_waktu_selesai_nullable_in_action_reports

Revision ID: 0b1e07005fe5
Revises: dc2cb194bdcf
Create Date: 2026-09-24 19:51:41.887413

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b1e07005fe5'
down_revision: Union[str, None] = 'dc2cb194bdcf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('action_reports', 'waktu_selesai',
               existing_type=sa.DateTime(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('action_reports', 'waktu_selesai',
               existing_type=sa.DateTime(),
               nullable=False)

