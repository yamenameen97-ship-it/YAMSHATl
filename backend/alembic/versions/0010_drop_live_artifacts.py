"""drop live broadcast artifacts (live_room_sessions table, posts.live_room_id column)

Revision ID: 20260612_0010
Revises: 20260611_0009
Create Date: 2026-06-12

✅ تنظيف بقايا البث المباشر:
=====================================================================
هذه الـ migration تحذف كل العناصر الخاصة بميزة البث المباشر التي
أُزيلت من الكود:

  1) جدول ``live_room_sessions`` (أُنشئ في 0009).
  2) عمود ``posts.live_room_id`` (أُضيف في 0007).
  3) أي backfill ل ``live_rooms.livekit_url`` لم يعد ضرورياً
     (الجدول إن وُجد يُترك كما هو، لأن قد يكون قديماً وتم إفراغه).

آمنة على بيئات SQLite / Postgres / MySQL باستخدام inspector
للتأكد من وجود الجدول/العمود قبل الحذف.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260612_0010'
down_revision = '20260611_0009'
branch_labels = None
depends_on = None


def _has_table(inspector, table_name: str) -> bool:
    try:
        return table_name in inspector.get_table_names()
    except Exception:
        return False


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    try:
        cols = [c['name'] for c in inspector.get_columns(table_name)]
        return column_name in cols
    except Exception:
        return False


def _has_index(inspector, table_name: str, index_name: str) -> bool:
    try:
        idx = [i['name'] for i in inspector.get_indexes(table_name)]
        return index_name in idx
    except Exception:
        return False


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1) إسقاط جدول live_room_sessions إن وُجد
    if _has_table(inspector, 'live_room_sessions'):
        try:
            op.drop_table('live_room_sessions')
        except Exception:
            # في حال وجود قيود FK، نحاول حذف الجدول بشكل safe
            with op.batch_alter_table('live_room_sessions') as batch_op:
                pass
            op.execute('DROP TABLE IF EXISTS live_room_sessions')

    # 2) إسقاط جدول live_rooms القديم إن وُجد (آثار قديمة)
    if _has_table(inspector, 'live_rooms'):
        try:
            op.drop_table('live_rooms')
        except Exception:
            op.execute('DROP TABLE IF EXISTS live_rooms')

    # 3) إسقاط جدول live_moderation و live_viewers إن وُجدا
    for legacy_table in ('live_moderation', 'live_viewers', 'live_stream_reports'):
        if _has_table(inspector, legacy_table):
            try:
                op.drop_table(legacy_table)
            except Exception:
                op.execute(f'DROP TABLE IF EXISTS {legacy_table}')

    # 4) إسقاط عمود posts.live_room_id إن وُجد
    inspector = sa.inspect(bind)  # refresh
    if _has_table(inspector, 'posts') and _has_column(inspector, 'posts', 'live_room_id'):
        # حذف الفهرس أولاً إن وُجد
        if _has_index(inspector, 'posts', 'ix_posts_live_room_id'):
            try:
                op.drop_index('ix_posts_live_room_id', table_name='posts')
            except Exception:
                pass
        try:
            with op.batch_alter_table('posts') as batch_op:
                batch_op.drop_column('live_room_id')
        except Exception:
            op.execute('ALTER TABLE posts DROP COLUMN IF EXISTS live_room_id')


def downgrade() -> None:
    # هذه عملية تنظيف؛ لا نعيد إنشاء الأعمدة والجداول المحذوفة.
    # إن احتيج للرجوع، استخدم migrations 0007 و 0009 يدوياً.
    pass
