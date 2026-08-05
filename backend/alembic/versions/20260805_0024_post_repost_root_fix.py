"""post repost root fix: posts.original_post_id + posts.is_repost (v89.37)

Revision ID: 20260805_0024
Revises: 20260803_0023
Create Date: 2026-08-05

يُضيف عمودَين إلى جدول posts لدعم إعادة النشر (Repost) كسجل Post حقيقي
يظهر في الفيد وفي بروفايل المُعيد للنشر تماماً مثل X/Twitter Retweet:

- posts.original_post_id: FK اختياري إلى posts.id — يشير إلى المنشور
  الأصلي عند كون هذا السجل إعادة نشر (ON DELETE SET NULL كي لا تختفي
  إعادات النشر من الفيد لو حُذف الأصل — تتحوّل إلى منشور "يتيم" بمحتواه المخزَّن).
- posts.is_repost: Boolean صريح لتمييز إعادة النشر، مع Index لتسريع الفلترة.

المشكلة التي يحلّها (v89.36):
  زر «إعادة النشر» في صفحة المنشور كان يستدعي share_post ويسجّل صفاً في
  post_shares فقط + يزيد عداد reposts_count — لكن **لا يُنشئ منشوراً**
  في الفيد ولا في بروفايل المُعيد للنشر، فيبدو للمستخدم أن الزر «لا يفعل شيئاً».
  الآن كل إعادة نشر تُنشئ سجل Post حقيقياً مربوطاً بالمنشور الأصلي.
"""
from alembic import op
import sqlalchemy as sa


revision = '20260805_0024'
down_revision = '20260803_0023'
branch_labels = None
depends_on = None


def _has_column(bind, table: str, column: str) -> bool:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return False
    cols = [c['name'] for c in inspector.get_columns(table)]
    return column in cols


def _has_index(bind, table: str, index_name: str) -> bool:
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return False
    idx_names = {i['name'] for i in inspector.get_indexes(table)}
    return index_name in idx_names


def upgrade() -> None:
    bind = op.get_bind()

    # posts.original_post_id
    if not _has_column(bind, 'posts', 'original_post_id'):
        with op.batch_alter_table('posts') as batch:
            batch.add_column(sa.Column(
                'original_post_id',
                sa.Integer(),
                nullable=True,
            ))
            # FK مع ON DELETE SET NULL — إعادات النشر تبقى حتى لو حُذف الأصل
            batch.create_foreign_key(
                'fk_posts_original_post_id',
                'posts',
                ['original_post_id'],
                ['id'],
                ondelete='SET NULL',
            )

        if not _has_index(bind, 'posts', 'ix_posts_original_post_id'):
            op.create_index(
                'ix_posts_original_post_id',
                'posts',
                ['original_post_id'],
            )

    # posts.is_repost
    if not _has_column(bind, 'posts', 'is_repost'):
        with op.batch_alter_table('posts') as batch:
            batch.add_column(sa.Column(
                'is_repost',
                sa.Boolean(),
                nullable=False,
                server_default=sa.text('false'),
            ))

        if not _has_index(bind, 'posts', 'ix_posts_is_repost'):
            op.create_index(
                'ix_posts_is_repost',
                'posts',
                ['is_repost'],
            )


def downgrade() -> None:
    bind = op.get_bind()

    if _has_index(bind, 'posts', 'ix_posts_is_repost'):
        op.drop_index('ix_posts_is_repost', table_name='posts')
    if _has_index(bind, 'posts', 'ix_posts_original_post_id'):
        op.drop_index('ix_posts_original_post_id', table_name='posts')

    with op.batch_alter_table('posts') as batch:
        if _has_column(bind, 'posts', 'is_repost'):
            batch.drop_column('is_repost')
        if _has_column(bind, 'posts', 'original_post_id'):
            try:
                batch.drop_constraint('fk_posts_original_post_id', type_='foreignkey')
            except Exception:
                pass
            batch.drop_column('original_post_id')
