"""auth hardening

Revision ID: 20260505_0002
Revises: 20260503_0001
Create Date: 2026-05-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = '20260505_0002'
down_revision = '20260503_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('users', sa.Column('email_verification_code', sa.String(length=128), nullable=True))
    op.add_column('users', sa.Column('email_verification_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('password_reset_code', sa.String(length=128), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('refresh_token_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('refresh_token_expires_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('password_changed_at', sa.DateTime(), nullable=True))
    op.create_index('ix_users_email_verified', 'users', ['email_verified'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_users_email_verified', table_name='users')
    op.drop_column('users', 'password_changed_at')
    op.drop_column('users', 'refresh_token_expires_at')
    op.drop_column('users', 'refresh_token_hash')
    op.drop_column('users', 'password_reset_expires_at')
    op.drop_column('users', 'password_reset_code')
    op.drop_column('users', 'email_verification_expires_at')
    op.drop_column('users', 'email_verification_code')
    op.drop_column('users', 'email_verified')
