"""create live_room_sessions table (root cause of viewers seeing blank stream)

Revision ID: 20260611_0009
Revises: 20260611_0008
Create Date: 2026-06-11

✅ FIX (2026-06-11) — السبب الجذري لمشكلة "البث لا يفتح للمشاهدين":
=====================================================================
الموديل ``app.models.live_session.LiveRoomSession`` يستخدم اسم الجدول
``live_room_sessions``، لكنه لم يُنشأ أبداً في أي migration سابقة.
الـ migrations الموجودة فقط:
  - 0007: تضيف عمود ``posts.live_room_id``
  - 0008: backfill لعمود ``live_rooms.livekit_url`` (جدول مختلف!)

النتيجة في الإنتاج:
  • POST /live_rooms يفشل بـ 500 (relation does not exist) أو ينجح
    على SQLite فقط لأن create_all() ينشئه عرضياً.
  • على Postgres (Render) → لا يوجد جدول → كل INSERT يفشل
    أو يُلتقط في try/except ويُعاد 500 بدون تفاصيل.
  • صفحة التحكم تعرض "بدأ البث" لأنها تعتمد على
    in-memory live_store، لكن المشاهد يستدعي
    /live_room/{id}/token الذي يحتاج السجل من DB → 404 →
    الصفحة تُحمَّل بدون فيديو ("جارٍ الاتصال بالبث... انتظر قليلاً").

هذه الـmigration:
  1) تنشئ جدول live_room_sessions بكامل أعمدته (idempotent).
  2) تنشئ الفهارس المطلوبة للأداء.
  3) آمنة على بيئات SQLite/Postgres/MySQL.
"""
from alembic import op
import sqlalchemy as sa


revision = '20260611_0009'
down_revision = '20260611_0008'
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    try:
        return name in insp.get_table_names()
    except Exception:
        return False


def _has_index(table: str, index_name: str) -> bool:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    try:
        return any(ix['name'] == index_name for ix in insp.get_indexes(table))
    except Exception:
        return False


def upgrade():
    # 1) إنشاء الجدول إن لم يكن موجوداً
    if not _has_table('live_room_sessions'):
        op.create_table(
            'live_room_sessions',
            sa.Column('id', sa.String(length=100), primary_key=True, nullable=False),
            sa.Column('host_user_id', sa.Integer(), nullable=False),
            sa.Column('host_username', sa.String(length=50), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False, server_default='Live Room'),
            sa.Column('livekit_room', sa.String(length=255), nullable=True),
            sa.Column('livekit_url', sa.String(length=500), nullable=True),
            sa.Column(
                'stream_status',
                sa.String(length=50),
                nullable=False,
                server_default='setup_required',
            ),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.true()),
            sa.Column('viewer_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('peak_viewer_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('hearts_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column(
                'recording_status', sa.String(length=50), nullable=False, server_default='idle'
            ),
            sa.Column('recording_url', sa.String(length=1000), nullable=True),
            sa.Column('extra_json', sa.Text(), nullable=True),
            sa.Column(
                'created_at',
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column(
                'last_activity_at',
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column('ended_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(
                ['host_user_id'], ['users.id'], ondelete='CASCADE'
            ),
        )

    # 2) إنشاء الفهارس (idempotent)
    indexes = [
        ('ix_live_room_sessions_host_user_id', ['host_user_id']),
        ('ix_live_room_sessions_host_username', ['host_username']),
        ('ix_live_room_sessions_livekit_room', ['livekit_room']),
        ('ix_live_room_sessions_stream_status', ['stream_status']),
        ('ix_live_room_sessions_is_active', ['is_active']),
        ('ix_live_room_sessions_is_public', ['is_public']),
        ('ix_live_room_sessions_created_at', ['created_at']),
        ('ix_live_room_sessions_last_activity_at', ['last_activity_at']),
    ]
    for ix_name, cols in indexes:
        if not _has_index('live_room_sessions', ix_name):
            try:
                op.create_index(ix_name, 'live_room_sessions', cols, unique=False)
            except Exception:
                # قد يكون موجوداً بصيغة implicit
                pass


def downgrade():
    # لا نُسقط الجدول في الإنتاج لتفادي فقد البيانات.
    # إن احتجت rollback يدوياً: DROP TABLE live_room_sessions CASCADE;
    pass
