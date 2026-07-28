"""reels/stories/messages share fields: link_card, verified_by_yamshat, admin_source_* (v88.87)

Revision ID: 20260728_0021
Revises: 20260728_0020
Create Date: 2026-07-28

يُضيف الحقول التي يرسلها الفرونت في نظام المشاركة (share) الموثق لدى Yamshat
إلى جداول reels / stories / messages (تم إضافتها مسبقاً إلى posts في 0020):

- link_card: JSON نصي لبيانات كارت الرابط الغني.
- verified_by_yamshat: علامة "موثق لدى Yamshat" (تُفعّل عند "تنزيل ومشاركة").
- admin_source_*: بيانات المصدر الأصلية — لا تُعرض للمستخدمين، يقرأها الأدمن فقط.
"""
from alembic import op
import sqlalchemy as sa


revision = '20260728_0021'
down_revision = '20260728_0020'
branch_labels = None
depends_on = None


# قائمة الأعمدة المشتركة (نفسها في الجداول الثلاثة)
_SHARE_COLUMNS = [
    sa.Column('link_card', sa.Text(), nullable=True),
    sa.Column('verified_by_yamshat', sa.Boolean(), nullable=False, server_default=sa.text('false')),
    sa.Column('admin_source_platform', sa.String(length=60), nullable=True),
    sa.Column('admin_source_platform_name', sa.String(length=120), nullable=True),
    sa.Column('admin_source_url', sa.Text(), nullable=True),
    sa.Column('admin_source_title', sa.Text(), nullable=True),
    sa.Column('admin_source_text', sa.Text(), nullable=True),
    sa.Column('admin_source_author', sa.String(length=200), nullable=True),
    sa.Column('admin_source_channel', sa.String(length=200), nullable=True),
    sa.Column('admin_source_captured_at', sa.DateTime(), nullable=True),
    sa.Column('admin_source_share_mode', sa.String(length=20), nullable=True),
    sa.Column('admin_source_download_size', sa.Integer(), nullable=True),
    sa.Column('admin_source_download_mime', sa.String(length=120), nullable=True),
]

_TABLES = ['reels', 'stories', 'messages']


def upgrade() -> None:
    for table in _TABLES:
        with op.batch_alter_table(table) as batch:
            for col in _SHARE_COLUMNS:
                batch.add_column(col)
        op.create_index(
            f'ix_{table}_verified_by_yamshat',
            table,
            ['verified_by_yamshat'],
        )
        op.create_index(
            f'ix_{table}_admin_source_platform',
            table,
            ['admin_source_platform'],
        )


def downgrade() -> None:
    for table in _TABLES:
        op.drop_index(f'ix_{table}_admin_source_platform', table_name=table)
        op.drop_index(f'ix_{table}_verified_by_yamshat', table_name=table)
        with op.batch_alter_table(table) as batch:
            batch.drop_column('admin_source_download_mime')
            batch.drop_column('admin_source_download_size')
            batch.drop_column('admin_source_share_mode')
            batch.drop_column('admin_source_captured_at')
            batch.drop_column('admin_source_channel')
            batch.drop_column('admin_source_author')
            batch.drop_column('admin_source_text')
            batch.drop_column('admin_source_title')
            batch.drop_column('admin_source_url')
            batch.drop_column('admin_source_platform_name')
            batch.drop_column('admin_source_platform')
            batch.drop_column('verified_by_yamshat')
            batch.drop_column('link_card')
