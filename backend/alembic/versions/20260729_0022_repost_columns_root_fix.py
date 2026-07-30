"""repost columns: posts.reposts_count + post_shares.share_type/quote_text (v88.99)

Revision ID: 20260729_0022
Revises: 20260728_0021
Create Date: 2026-07-29

يُضيف دعم إعادة النشر (Repost) كميزة مستقلة عن المشاركة العادية:
- posts.reposts_count: عدّاد منفصل لإعادات النشر (مثل reposts_count على X/Twitter).
- post_shares.share_type: تمييز نوع المشاركة — 'share' (عادية) أو 'repost' (إعادة نشر).
- post_shares.quote_text: نص الاقتباس عند إعادة النشر من نوع quote.

المشكلة التي يحلّها:
  الفرونت كان يستدعي sharePost(id, 'repost') لكن الباك إند كان يُعامله
  كمشاركة عادية بمنصة 'repost' — لا تمييز، لا عدّاد منفصل، لا تبديل (toggle).
"""
from alembic import op
import sqlalchemy as sa


revision = '20260729_0022'
down_revision = '20260728_0021'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # posts.reposts_count
    with op.batch_alter_table('posts') as batch:
        batch.add_column(sa.Column(
            'reposts_count',
            sa.Integer(),
            nullable=False,
            server_default=sa.text('0'),
        ))

    # post_shares.share_type + quote_text
    with op.batch_alter_table('post_shares') as batch:
        batch.add_column(sa.Column(
            'share_type',
            sa.String(length=20),
            nullable=False,
            server_default=sa.text("'share'"),
        ))
        batch.add_column(sa.Column('quote_text', sa.Text(), nullable=True))

    op.create_index(
        'ix_post_shares_share_type',
        'post_shares',
        ['share_type'],
    )


def downgrade() -> None:
    op.drop_index('ix_post_shares_share_type', table_name='post_shares')
    with op.batch_alter_table('post_shares') as batch:
        batch.drop_column('quote_text')
        batch.drop_column('share_type')
    with op.batch_alter_table('posts') as batch:
        batch.drop_column('reposts_count')
