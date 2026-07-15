"""استكمال ربط الشات بالـ Backend زر بزر — جداول حفظ الرسائل والوسائط والـ reactions

Revision ID: 20260605_0005
Revises: 20260507_0004
Create Date: 2026-06-05 15:30:00.000000

ما يضيفه هذا الـ migration:

1. أعمدة جديدة على جدول `messages`:
   - reply_to_id     : معرف الرسالة المردود عليها
   - forwarded_from_id : معرف الرسالة الأصلية عند التمرير
   - edited_at       : وقت تعديل الرسالة (للتعديل)
   - is_recalled     : هل تم استرجاع الرسالة (recall)
   - expires_at      : وقت انتهاء صلاحية الرسالة (disappearing messages)
   - reactions_count : عداد سريع للتفاعلات (لتجنب JOIN)
   - is_edited       : فلاج سريع للتعديل

2. جدول `message_reactions` لحفظ تفاعلات الرسائل (👍 ❤️ 😂 ...).

3. جدول `message_attachments` لدعم رسالة بأكثر من مرفق
   (صور/فيديو/صوت/ملفات متعددة في رسالة واحدة).

4. جدول `chat_typing_state` (اختياري - لـ HTTP fallback لمؤشر الكتابة).

كل التعديلات Render-safe:
- لا تكسر أي عمود/جدول موجود
- كل الأعمدة الجديدة nullable أو لها default
- كل الفهارس مع IF NOT EXISTS منطقياً
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20260605_0005'
down_revision = '20260507_0004'
branch_labels = None
depends_on = None


def _safe_has_column(table_name: str, column_name: str) -> bool:
    """فحص آمن لوجود عمود (يدعم SQLite + Postgres)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    try:
        cols = [c['name'] for c in inspector.get_columns(table_name)]
        return column_name in cols
    except Exception:
        return False


def _safe_has_table(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    try:
        return table_name in inspector.get_table_names()
    except Exception:
        return False


def upgrade() -> None:
    # ============================================================
    # 1) أعمدة جديدة على جدول messages
    # ============================================================
    if not _safe_has_column('messages', 'reply_to_id'):
        op.add_column(
            'messages',
            sa.Column('reply_to_id', sa.Integer(), nullable=True),
        )
        op.create_foreign_key(
            'fk_messages_reply_to_id',
            'messages',
            'messages',
            ['reply_to_id'],
            ['id'],
            ondelete='SET NULL',
        )
        op.create_index('ix_messages_reply_to_id', 'messages', ['reply_to_id'])

    if not _safe_has_column('messages', 'forwarded_from_id'):
        op.add_column(
            'messages',
            sa.Column('forwarded_from_id', sa.Integer(), nullable=True),
        )
        op.create_foreign_key(
            'fk_messages_forwarded_from_id',
            'messages',
            'messages',
            ['forwarded_from_id'],
            ['id'],
            ondelete='SET NULL',
        )
        op.create_index('ix_messages_forwarded_from_id', 'messages', ['forwarded_from_id'])

    if not _safe_has_column('messages', 'edited_at'):
        op.add_column('messages', sa.Column('edited_at', sa.DateTime(), nullable=True))

    if not _safe_has_column('messages', 'is_edited'):
        op.add_column(
            'messages',
            sa.Column('is_edited', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        )

    if not _safe_has_column('messages', 'is_recalled'):
        op.add_column(
            'messages',
            sa.Column('is_recalled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        )

    if not _safe_has_column('messages', 'expires_at'):
        op.add_column('messages', sa.Column('expires_at', sa.DateTime(), nullable=True))
        op.create_index('ix_messages_expires_at', 'messages', ['expires_at'])

    if not _safe_has_column('messages', 'reactions_count'):
        op.add_column(
            'messages',
            sa.Column('reactions_count', sa.Integer(), nullable=False, server_default='0'),
        )

    # فهرس مركّب لإسراع جلب محادثة (sender_id, receiver_id, id)
    try:
        op.create_index(
            'ix_messages_conversation_pair',
            'messages',
            ['sender_id', 'receiver_id', 'id'],
        )
    except Exception:
        # الفهرس قد يكون موجوداً مسبقاً في بعض البيئات
        pass

    # ============================================================
    # 2) جدول message_reactions
    # ============================================================
    if not _safe_has_table('message_reactions'):
        op.create_table(
            'message_reactions',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column(
                'message_id',
                sa.Integer(),
                sa.ForeignKey('messages.id', ondelete='CASCADE'),
                nullable=False,
            ),
            sa.Column(
                'user_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='CASCADE'),
                nullable=False,
            ),
            sa.Column('reaction', sa.String(length=32), nullable=False),
            sa.Column(
                'created_at',
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.UniqueConstraint(
                'message_id', 'user_id', 'reaction',
                name='uq_message_reaction_per_user',
            ),
        )
        op.create_index(
            'ix_message_reactions_message_id',
            'message_reactions',
            ['message_id'],
        )
        op.create_index(
            'ix_message_reactions_user_id',
            'message_reactions',
            ['user_id'],
        )

    # ============================================================
    # 3) جدول message_attachments
    # ============================================================
    if not _safe_has_table('message_attachments'):
        op.create_table(
            'message_attachments',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column(
                'message_id',
                sa.Integer(),
                sa.ForeignKey('messages.id', ondelete='CASCADE'),
                nullable=False,
            ),
            sa.Column('url', sa.Text(), nullable=False),
            sa.Column('cdn_url', sa.Text(), nullable=True),
            sa.Column('thumbnail_url', sa.Text(), nullable=True),
            sa.Column('kind', sa.String(length=20), nullable=False, server_default='file'),
            sa.Column('mime_type', sa.String(length=128), nullable=True),
            sa.Column('file_name', sa.String(length=255), nullable=True),
            sa.Column('file_size', sa.BigInteger(), nullable=True),
            sa.Column('width', sa.Integer(), nullable=True),
            sa.Column('height', sa.Integer(), nullable=True),
            sa.Column('duration_seconds', sa.Float(), nullable=True),
            sa.Column('waveform', sa.Text(), nullable=True),  # JSON-encoded for voice notes
            sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
            sa.Column(
                'created_at',
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            ),
        )
        op.create_index(
            'ix_message_attachments_message_id',
            'message_attachments',
            ['message_id'],
        )

    # ============================================================
    # 4) جدول chat_typing_state (HTTP fallback لمؤشر الكتابة)
    # ============================================================
    if not _safe_has_table('chat_typing_state'):
        op.create_table(
            'chat_typing_state',
            sa.Column('id', sa.Integer(), primary_key=True, index=True),
            sa.Column(
                'user_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='CASCADE'),
                nullable=False,
            ),
            sa.Column(
                'peer_id',
                sa.Integer(),
                sa.ForeignKey('users.id', ondelete='CASCADE'),
                nullable=True,
            ),
            sa.Column('group_key', sa.String(length=80), nullable=True),
            sa.Column(
                'updated_at',
                sa.DateTime(),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.UniqueConstraint(
                'user_id', 'peer_id', 'group_key',
                name='uq_chat_typing_user_peer',
            ),
        )


def downgrade() -> None:
    # 4) chat_typing_state
    if _safe_has_table('chat_typing_state'):
        op.drop_table('chat_typing_state')

    # 3) message_attachments
    if _safe_has_table('message_attachments'):
        op.drop_index('ix_message_attachments_message_id', table_name='message_attachments')
        op.drop_table('message_attachments')

    # 2) message_reactions
    if _safe_has_table('message_reactions'):
        op.drop_index('ix_message_reactions_user_id', table_name='message_reactions')
        op.drop_index('ix_message_reactions_message_id', table_name='message_reactions')
        op.drop_table('message_reactions')

    # 1) أعمدة messages
    for col in (
        'reactions_count',
        'expires_at',
        'is_recalled',
        'is_edited',
        'edited_at',
    ):
        if _safe_has_column('messages', col):
            try:
                if col == 'expires_at':
                    op.drop_index('ix_messages_expires_at', table_name='messages')
            except Exception:
                pass
            op.drop_column('messages', col)

    if _safe_has_column('messages', 'forwarded_from_id'):
        try:
            op.drop_index('ix_messages_forwarded_from_id', table_name='messages')
            op.drop_constraint('fk_messages_forwarded_from_id', 'messages', type_='foreignkey')
        except Exception:
            pass
        op.drop_column('messages', 'forwarded_from_id')

    if _safe_has_column('messages', 'reply_to_id'):
        try:
            op.drop_index('ix_messages_reply_to_id', table_name='messages')
            op.drop_constraint('fk_messages_reply_to_id', 'messages', type_='foreignkey')
        except Exception:
            pass
        op.drop_column('messages', 'reply_to_id')

    try:
        op.drop_index('ix_messages_conversation_pair', table_name='messages')
    except Exception:
        pass
