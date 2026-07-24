"""user_restrictions table (v88.53)

Revision ID: 20260724_0019
Revises: 20260722_0018
Create Date: 2026-07-24
"""
from alembic import op
import sqlalchemy as sa


revision = '20260724_0019'
down_revision = '20260722_0018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_restrictions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('restriction_type', sa.String(length=40), nullable=False, index=True),
        sa.Column('imposed_by_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('imposed_by_username', sa.String(length=150), nullable=True),
        sa.Column('reason', sa.String(length=500), nullable=True),
        sa.Column('related_report_ids', sa.String(length=500), nullable=True),
        sa.Column('base_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('repeat_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true'), index=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(), nullable=True, index=True),
        sa.Column('lifted_at', sa.DateTime(), nullable=True),
        sa.Column('lifted_by_username', sa.String(length=150), nullable=True),
        sa.Column('appeal_status', sa.String(length=20), nullable=False, server_default='none', index=True),
        sa.Column('appeal_message', sa.Text(), nullable=True),
        sa.Column('appeal_submitted_at', sa.DateTime(), nullable=True),
        sa.Column('appeal_response', sa.Text(), nullable=True),
        sa.Column('appeal_resolved_at', sa.DateTime(), nullable=True),
        sa.Column('appeal_resolved_by', sa.String(length=150), nullable=True),
        sa.Column('notification_id', sa.Integer(), nullable=True, index=True),
    )
    op.create_index(
        'ix_user_restrictions_user_type_active',
        'user_restrictions',
        ['user_id', 'restriction_type', 'is_active'],
    )
    op.create_index('ix_user_restrictions_until', 'user_restrictions', ['expires_at'])


def downgrade() -> None:
    op.drop_index('ix_user_restrictions_until', table_name='user_restrictions')
    op.drop_index('ix_user_restrictions_user_type_active', table_name='user_restrictions')
    op.drop_table('user_restrictions')
