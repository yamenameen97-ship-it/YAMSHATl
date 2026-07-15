"""create platform metrics, revenue transactions, and post views tables

Revision ID: 20260614_0011
Revises: 20260614_0010
Create Date: 2026-06-14

ينشئ ثلاثة جداول لربط لوحة التحكم الإدارية بأرقام حقيقية:
  platform_metrics_daily  — تجميعة يومية للأرقام (للرسوم البيانية والمقارنة الشهرية)
  revenue_transactions    — معاملات الإيرادات الفعلية
  post_views              — تتبع مشاهدات المنشورات
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = '20260614_0011'
down_revision = '20260614_0010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============ platform_metrics_daily ============
    op.create_table(
        'platform_metrics_daily',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('total_users', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_users', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('new_users', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_posts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_reels', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_stories', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_comments', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_messages', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_likes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_shares', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('revenue_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_platform_metrics_daily_date', 'platform_metrics_daily', ['date'], unique=True)

    # ============ revenue_transactions ============
    op.create_table(
        'revenue_transactions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('source', sa.String(50), nullable=False, server_default='other'),
        sa.Column('reference_id', sa.String(120), nullable=True),
        sa.Column('amount_cents', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('currency', sa.String(10), nullable=False, server_default='USD'),
        sa.Column('coins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(30), nullable=False, server_default='completed'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_revenue_transactions_created_at', 'revenue_transactions', ['created_at'])
    op.create_index('ix_revenue_transactions_user_id', 'revenue_transactions', ['user_id'])
    op.create_index('ix_revenue_transactions_source', 'revenue_transactions', ['source'])

    # ============ post_views ============
    op.create_table(
        'post_views',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('post_id', sa.Integer(), sa.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('viewed_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('duration_seconds', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_post_views_post_id', 'post_views', ['post_id'])
    op.create_index('ix_post_views_viewed_at', 'post_views', ['viewed_at'])
    op.create_index('ix_post_views_user_id', 'post_views', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_post_views_user_id', table_name='post_views')
    op.drop_index('ix_post_views_viewed_at', table_name='post_views')
    op.drop_index('ix_post_views_post_id', table_name='post_views')
    op.drop_table('post_views')

    op.drop_index('ix_revenue_transactions_source', table_name='revenue_transactions')
    op.drop_index('ix_revenue_transactions_user_id', table_name='revenue_transactions')
    op.drop_index('ix_revenue_transactions_created_at', table_name='revenue_transactions')
    op.drop_table('revenue_transactions')

    op.drop_index('ix_platform_metrics_daily_date', table_name='platform_metrics_daily')
    op.drop_table('platform_metrics_daily')
