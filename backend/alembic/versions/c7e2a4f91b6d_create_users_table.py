"""create users table

Revision ID: c7e2a4f91b6d
Revises: a1f3c9e7b2d4
Create Date: 2026-07-30 00:00:00.000000

Multi-user auth (Phase 7 addendum): replaces the single shared admin login
with per-person accounts. app/main.py's startup lifespan seeds the first row
from ADMIN_USERNAME/ADMIN_PASSWORD_HASH so the already-configured .env
credentials keep working without re-setup.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7e2a4f91b6d'
down_revision: Union[str, Sequence[str], None] = 'a1f3c9e7b2d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
