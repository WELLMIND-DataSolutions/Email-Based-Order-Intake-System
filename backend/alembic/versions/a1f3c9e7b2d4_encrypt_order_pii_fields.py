"""widen order PII columns to Text for Fernet ciphertext

Revision ID: a1f3c9e7b2d4
Revises: 70381ddfcf1f
Create Date: 2026-07-29 00:00:00.000000

Encryption itself happens at the application layer (app/db/encrypted_types.py
EncryptedString), not here - this migration only widens customer_name/
customer_email from String(255) to Text since Fernet ciphertext runs longer
than the plaintext it replaces. It does NOT re-encrypt existing rows; per
project decision, the dev database is wiped and recreated instead of
migrating old plaintext test data.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f3c9e7b2d4'
down_revision: Union[str, Sequence[str], None] = '70381ddfcf1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('orders') as batch_op:
        batch_op.alter_column('customer_name', existing_type=sa.String(length=255), type_=sa.Text())
        batch_op.alter_column('customer_email', existing_type=sa.String(length=255), type_=sa.Text())


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('orders') as batch_op:
        batch_op.alter_column('customer_name', existing_type=sa.Text(), type_=sa.String(length=255))
        batch_op.alter_column('customer_email', existing_type=sa.Text(), type_=sa.String(length=255))
