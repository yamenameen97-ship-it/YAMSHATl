"""post share fields: link_card, verified_by_yamshat, admin_source_* (v88.86)

Revision ID: 20260728_0020
Revises: 20260724_0019
Create Date: 2026-07-28

يُضيف الحقول التي يرسلها الفرونت في نظام المشاركة (share) الموثق لدى Yamshat:
- link_card: JSON نصي لبيانات كارت الرابط الغني (يُعرض في الفيد).
- verified_by_yamshat: علامة "موثق لدى Yamshat" (تُفعّل عند "تنزيل ومشاركة").
- admin_source_*: بيانات المصدر الأصلية — لا تُعرض للمستخدمين، يقرأها الأدمن فقط.
"""
from alembic import op
import sqlalchemy as sa


revision = '20260728_0020'
down_revision = '20260724_0019'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('posts') as batch:
        batch.add_column(sa.Column('link_card', sa.Text(), nullable=True))
        batch.add_column(sa.Column(
            'verified_by_yamshat',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('false'),
        ))
        batch.add_column(sa.Column('admin_source_platform', sa.String(length=60), nullable=True))
        batch.add_column(sa.Column('admin_source_platform_name', sa.String(length=120), nullable=True))
        batch.add_column(sa.Column('admin_source_url', sa.Text(), nullable=True))
        batch.add_column(sa.Column('admin_source_title', sa.Text(), nullable=True))
        batch.add_column(sa.Column('admin_source_text', sa.Text(), nullable=True))
        batch.add_column(sa.Column('admin_source_author', sa.String(length=200), nullable=True))
        batch.add_column(sa.Column('admin_source_channel', sa.String(length=200), nullable=True))
        batch.add_column(sa.Column('admin_source_captured_at', sa.DateTime(), nullable=True))
        batch.add_column(sa.Column('admin_source_share_mode', sa.String(length=20), nullable=True))
        batch.add_column(sa.Column('admin_source_download_size', sa.Integer(), nullable=True))
        batch.add_column(sa.Column('admin_source_download_mime', sa.String(length=120), nullable=True))

    op.create_index(
        'ix_posts_verified_by_yamshat',
        'posts',
        ['verified_by_yamshat'],
    )
    op.create_index(
        'ix_posts_admin_source_platform',
        'posts',
        ['admin_source_platform'],
    )


def downgrade() -> None:
    op.drop_index('ix_posts_admin_source_platform', table_name='posts')
    op.drop_index('ix_posts_verified_by_yamshat', table_name='posts')
    with op.batch_alter_table('posts') as batch:
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
