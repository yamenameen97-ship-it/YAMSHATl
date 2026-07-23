"""v88.46 — admin chat & group control (freeze + system-wide chat mute)

Revision ID: 0018_admin_chat_group_control
Revises: 20260721_0017_profile_identity_fields
Create Date: 2026-07-22 00:00:00.000000

هذا الترحيل يضيف:
  - Group.is_frozen / frozen_at / frozen_by / frozen_reason
    → تجميد المجموعة كلياً بواسطة المدير العام (سيطرة إدارية خارقة)
  - User.chat_muted_until / chat_muted_by / chat_muted_reason
    → كتم مؤقت من الدردشة فقط (system-wide chat mute) دون حظر كامل للحساب
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0018_admin_chat_group_control'
down_revision = '20260721_0017_profile_identity_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ---- Group: تجميد المجموعة إدارياً ----
    with op.batch_alter_table('groups') as batch_op:
        batch_op.add_column(sa.Column('is_frozen', sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column('frozen_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('frozen_by', sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column('frozen_reason', sa.String(length=500), nullable=True))
        batch_op.create_index('ix_groups_is_frozen', ['is_frozen'])

    # ---- User: كتم مؤقت من الدردشة على مستوى النظام ----
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('chat_muted_until', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('chat_muted_by', sa.String(length=150), nullable=True))
        batch_op.add_column(sa.Column('chat_muted_reason', sa.String(length=500), nullable=True))
        batch_op.create_index('ix_users_chat_muted_until', ['chat_muted_until'])


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_index('ix_users_chat_muted_until')
        batch_op.drop_column('chat_muted_reason')
        batch_op.drop_column('chat_muted_by')
        batch_op.drop_column('chat_muted_until')

    with op.batch_alter_table('groups') as batch_op:
        batch_op.drop_index('ix_groups_is_frozen')
        batch_op.drop_column('frozen_reason')
        batch_op.drop_column('frozen_by')
        batch_op.drop_column('frozen_at')
        batch_op.drop_column('is_frozen')
