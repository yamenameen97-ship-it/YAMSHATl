"""drop residual live broadcast artifacts (notify_live column, host_levels table)

Revision ID: 20260612_0011
Revises: 20260612_0010
Create Date: 2026-06-12

✅ تنظيف بقايا البث المباشر (تكملة):
=====================================================================
هذه الـ migration تحذف بقايا بثّ مباشر من جانب المستخدم والتفاعل:

  1) عمود ``user_preferences.notify_live`` (إعداد إشعارات البث).
  2) جدول ``host_levels`` (مستويات المضيف للبث).

آمنة على بيئات SQLite / Postgres / MySQL باستخدام inspector
للتأكد من وجود العمود/الجدول قبل الحذف.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260612_0011'
down_revision = '20260612_0010'
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


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1) إسقاط عمود user_preferences.notify_live إن وُجد
    if _has_table(inspector, 'user_preferences') and _has_column(inspector, 'user_preferences', 'notify_live'):
        try:
            with op.batch_alter_table('user_preferences') as batch_op:
                batch_op.drop_column('notify_live')
        except Exception:
            op.execute('ALTER TABLE user_preferences DROP COLUMN IF EXISTS notify_live')

    # 2) إسقاط جدول host_levels إن وُجد
    inspector = sa.inspect(bind)  # refresh
    if _has_table(inspector, 'host_levels'):
        try:
            op.drop_table('host_levels')
        except Exception:
            op.execute('DROP TABLE IF EXISTS host_levels')


def downgrade() -> None:
    # عملية تنظيف نهائية؛ لا نعيد إنشاء الأعمدة والجداول المحذوفة.
    pass
