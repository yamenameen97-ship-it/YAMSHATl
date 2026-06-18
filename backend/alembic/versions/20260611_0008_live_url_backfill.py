"""ensure livekit_url present + backfill nulls

✅ FIX (2026-06-11): بعض السجلات القديمة في live_rooms قد تحتوي على livekit_url=NULL،
مما يجعل الواجهة تتلقى استجابة /token بـ livekit_url فارغ → فشل اتصال المشاهد.
هذه الـ migration:
1) تضمن وجود العمود (idempotent).
2) تملأ أي قيم NULL من متغير البيئة LIVEKIT_URL (يُعالج في الـ runtime عبر الفولباك).

Revision ID: 20260611_0008
Revises: 20260611_0007
Create Date: 2026-06-11
"""
from alembic import op
import sqlalchemy as sa


revision = '20260611_0008'
down_revision = '20260611_0007'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    cols = [c['name'] for c in inspector.get_columns('live_rooms')] if inspector.has_table('live_rooms') else []
    if 'live_rooms' in inspector.get_table_names() and 'livekit_url' not in cols:
        op.add_column('live_rooms', sa.Column('livekit_url', sa.String(length=512), nullable=True))
    # ملاحظة: تعبئة NULL تُعالج runtime عبر settings.LIVEKIT_URL في live.py
    # لا حاجة لـ UPDATE هنا حتى لا نُلصق قيمة قد تتغير لاحقاً.


def downgrade():
    # لا نحذف العمود (آمن للإنتاج).
    pass
